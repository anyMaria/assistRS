"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, generations, publications, ideas, brandMemoryRules } from "@/db";

/**
 * Applique une légende générée : enregistre l'édition sur la génération, puis copie
 * le texte sur la publication (`caption`) ou l'idée (`content`, sa « structure »/brief).
 */
export async function appliquerLegende(
  kind: "idee" | "publication",
  id: number,
  generationId: number,
  texte: string,
) {
  await db
    .update(generations)
    .set({ editedOutput: texte, appliedAt: new Date() })
    .where(eq(generations.id, generationId));

  if (kind === "publication") {
    await db.update(publications).set({ caption: texte }).where(eq(publications.id, id));
    revalidatePath("/planning");
  } else {
    await db.update(ideas).set({ content: texte }).where(eq(ideas.id, id));
    revalidatePath("/idees");
  }
  revalidatePath("/");
}

/** Insère les règles cochées par Ana dans la mémoire de la marque après aperçu. */
export async function enregistrerRegles(accountId: number, origin: string, regles: string[]) {
  const filtered = regles.map((r) => r.trim()).filter(Boolean);
  if (filtered.length === 0) return;
  await db.insert(brandMemoryRules).values(
    filtered.map((rule) => ({
      accountId,
      rule,
      origin,
    })),
  );
  revalidatePath(`/marques/${accountId}`);
}
