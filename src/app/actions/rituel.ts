"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, monthlyRituals, accounts, publications } from "@/db";
import { buildBrandContext } from "@/lib/brand-context";
import { buildCandidateSlots, currentMonth } from "@/lib/rituel-calendar";
import { Type, PREAMBULE, generateJSON } from "@/lib/gemini";
import { logUsage } from "@/lib/api-usage";
import { insertDefaultSteps } from "@/lib/production-steps";

/** Récupère (ou crée) la session de rituel du mois en cours pour une marque. */
export async function demarrerRituel(accountId: number, month: string = currentMonth()): Promise<{ id: number }> {
  const [existing] = await db
    .select()
    .from(monthlyRituals)
    .where(and(eq(monthlyRituals.accountId, accountId), eq(monthlyRituals.month, month)));
  if (existing) return { id: existing.id };
  const [row] = await db.insert(monthlyRituals).values({ accountId, month }).returning();
  return { id: row.id };
}

const answersSchema = z.object({
  quoiDeNeuf: z.string().default(""),
  promos: z.string().default(""),
  evenements: z.string().default(""),
  contraintes: z.string().default(""),
  nombrePublications: z.coerce.number().int().min(1).max(30).default(8),
});

export type GenererResult = { ok: true } | { ok: false; error: string };

/** Wizard → réponses stockées → appel Gemini → propositions (CONCEPTION.md §8, GUIDELINE.md §5.3). */
export async function genererPropositions(id: number, formData: FormData): Promise<GenererResult> {
  const [ritual] = await db.select().from(monthlyRituals).where(eq(monthlyRituals.id, id));
  if (!ritual) return { ok: false, error: "Rituel introuvable." };
  const [account] = await db.select().from(accounts).where(eq(accounts.id, ritual.accountId));
  if (!account) return { ok: false, error: "Marque introuvable." };

  const answers = answersSchema.parse({
    quoiDeNeuf: formData.get("quoiDeNeuf") ?? "",
    promos: formData.get("promos") ?? "",
    evenements: formData.get("evenements") ?? "",
    contraintes: formData.get("contraintes") ?? "",
    nombrePublications: formData.get("nombrePublications") ?? 8,
  });
  await db.update(monthlyRituals).set({ answers: JSON.stringify(answers) }).where(eq(monthlyRituals.id, id));

  const platforms: string[] = JSON.parse(account.platforms || "[]");
  const candidates = await buildCandidateSlots(ritual.month, platforms);
  if (candidates.length === 0) {
    return {
      ok: false,
      error: "Aucun créneau fort n'est configuré pour les plateformes de cette marque — vérifie la grille dans Programmation.",
    };
  }
  const brandContext = await buildBrandContext(account.id);
  const nombre = Math.min(answers.nombrePublications, candidates.length);
  const userMessage = `Mois à préparer : ${ritual.month}
Quoi de neuf ce mois-ci : ${answers.quoiDeNeuf || "rien de particulier"}
Promotions / lancements : ${answers.promos || "aucun"}
Événements : ${answers.evenements || "aucun"}
Contraintes : ${answers.contraintes || "aucune"}

Créneaux forts disponibles ce mois-ci (choisis parmi ceux-ci, en donnant leur "index") :
${candidates.map((c) => `${c.index} : ${c.date} (${c.jour}) ${c.heure}h — ${c.plateforme}`).join("\n")}

Choisis exactement ${nombre} créneaux parmi la liste ci-dessus (des index différents, bien répartis
dans le mois, jamais deux fois le même jour pour la même plateforme) et propose pour chacun une
publication : pilier, titre, accroche, format.`;

  const result = await generateJSON<{
    publications?: Array<{ index: number; pilier: string; titre: string; accroche: string; format: string }>;
  }>({
    systemInstruction: PREAMBULE + "\n\n" + brandContext,
    contents: userMessage,
    responseSchema: {
      type: Type.OBJECT,
      required: ["publications"],
      properties: {
        publications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["index", "pilier", "titre", "accroche", "format"],
            properties: {
              index: { type: Type.INTEGER },
              pilier: { type: Type.STRING },
              titre: { type: Type.STRING },
              accroche: { type: Type.STRING },
              format: { type: Type.STRING, enum: ["carrousel", "reel", "story", "post"] },
            },
          },
        },
      },
    },
  });
  if (!result.ok) return { ok: false, error: result.error };
  await logUsage("gemini", "rituel-calendrier", 0);

  const byIndex = new Map(candidates.map((c) => [c.index, c]));
  const seen = new Set<number>();
  const proposal = (result.data.publications ?? [])
    .filter((p) => byIndex.has(p.index) && !seen.has(p.index) && seen.add(p.index))
    .slice(0, nombre)
    .map((p) => {
      const c = byIndex.get(p.index)!;
      return {
        date: c.date,
        heure: c.heure,
        plateforme: c.plateforme,
        format: p.format,
        pilier: p.pilier,
        titre: p.titre,
        accroche: p.accroche,
      };
    });

  await db
    .update(monthlyRituals)
    .set({ proposal: JSON.stringify(proposal), status: "propose" })
    .where(eq(monthlyRituals.id, id));
  revalidatePath("/rituel");
  return { ok: true };
}

export type ValiderItem = {
  date: string;
  heure: number;
  plateforme: string;
  format: string;
  pilier: string;
  titre: string;
  accroche: string;
};

/** Ana valide/édite/retire ligne par ligne → les retenues deviennent des publications planifiées. */
export async function validerRituel(
  id: number,
  items: ValiderItem[],
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const [ritual] = await db.select().from(monthlyRituals).where(eq(monthlyRituals.id, id));
  if (!ritual) return { ok: false, error: "Rituel introuvable." };
  if (items.length === 0) return { ok: false, error: "Garde au moins une publication avant de valider." };

  let created = 0;
  for (const item of items) {
    const plannedAt = new Date(`${item.date}T${String(item.heure).padStart(2, "0")}:00:00`);
    const [row] = await db
      .insert(publications)
      .values({
        accountId: ritual.accountId,
        platform: item.plateforme,
        format: item.format,
        title: item.accroche ? `${item.titre} — ${item.accroche}` : item.titre,
        status: "planifiee",
        plannedAt,
      })
      .returning();
    await insertDefaultSteps(row.id);
    created++;
  }
  await db.update(monthlyRituals).set({ status: "valide" }).where(eq(monthlyRituals.id, id));
  revalidatePath("/rituel");
  revalidatePath("/planning");
  revalidatePath("/");
  return { ok: true, created };
}
