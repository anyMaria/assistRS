// Pertinence Gemini pour S'inspirer (G13) : requête optimisée par source en amont,
// tri de pertinence des résultats en aval. Chaque appel est optionnel — tout échec
// dégrade vers le comportement actuel (normalizeQuery / relevant = true), jamais bloquant.
import { eq } from "drizzle-orm";
import { db, inspirationItems, accounts, brandProfiles } from "@/db";
import { generateJSON, PREAMBULE, Type } from "@/lib/gemini";
import { normalizeQuery, type ApifySource } from "@/lib/apify";

/** Requête idéale pour la source, à partir du thème + contexte de marque succinct. */
export async function optimizeQuery(theme: string, source: ApifySource, accountId?: number | null): Promise<string> {
  let brandLine = "";
  if (accountId) {
    try {
      const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
      const [profile] = await db.select().from(brandProfiles).where(eq(brandProfiles.accountId, accountId));
      brandLine = [account?.sector, profile?.positioning].filter(Boolean).join(" — ");
    } catch {
      // Contexte optionnel : une erreur ici ne doit pas empêcher la génération de requête.
    }
  }

  const consignesParSource: Record<ApifySource, string> = {
    pinterest: "2 à 3 mots-clés visuels, sans accents (l'anglais marche souvent mieux — choisis la meilleure langue).",
    instagram: "UN SEUL hashtag, sans # ni espaces.",
    linkedin: "2 à 4 mots-clés simples.",
    facebook: "2 à 4 mots-clés simples.",
    metaAds: "2 à 4 mots-clés simples.",
  };

  const result = await generateJSON<{ requete: string }>({
    systemInstruction: PREAMBULE,
    contents: `Thème : ${theme}${brandLine ? `\nContexte de marque : ${brandLine}` : ""}\nSource : ${source}\nProduis la requête idéale pour rechercher des inspirations visuelles sur cette source. Consigne : ${consignesParSource[source]}`,
    responseSchema: {
      type: Type.OBJECT,
      required: ["requete"],
      properties: { requete: { type: Type.STRING } },
    },
  });

  if (!result.ok || !result.data.requete?.trim()) {
    return normalizeQuery(theme);
  }
  return result.data.requete.trim();
}

/**
 * Un seul appel Gemini pour tout le lot d'items ingérés : score de pertinence 0-10 par
 * rapport au thème. Items < 4 → relevant = false. Échec Gemini → tout reste relevant = true
 * (déjà la valeur par défaut en base, donc rien à faire dans ce cas).
 */
export async function scoreRelevance(theme: string, items: { id: number; title: string; author: string }[]): Promise<void> {
  if (items.length === 0) return;

  const result = await generateJSON<{ scores: { id: number; score: number }[] }>({
    systemInstruction: PREAMBULE,
    contents: `Thème recherché : ${theme}\nVoici une liste de visuels trouvés (id, titre, auteur). Note chacun de 0 à 10 selon sa pertinence par rapport au thème.\n${JSON.stringify(items)}`,
    responseSchema: {
      type: Type.OBJECT,
      required: ["scores"],
      properties: {
        scores: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["id", "score"],
            properties: { id: { type: Type.NUMBER }, score: { type: Type.NUMBER } },
          },
        },
      },
    },
  });

  if (!result.ok) return;

  const nonRelevantIds = result.data.scores.filter((s) => s.score < 4).map((s) => s.id);
  for (const id of nonRelevantIds) {
    await db.update(inspirationItems).set({ relevant: false }).where(eq(inspirationItems.id, id));
  }
}
