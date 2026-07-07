// Ingestion des résultats Apify — module partagé entre le polling client (statut),
// le webhook Apify et le rattrapage cron (G13). Idempotent : ne fait rien si la
// recherche n'est plus "en_cours", ce qui protège contre les appels concurrents.
import { eq } from "drizzle-orm";
import { db, inspirationSearches, inspirationItems } from "@/db";
import { ACTORS, getApifyRunStatus, getApifyDatasetItems, normalizeItem, startApifyRun, type ApifySource } from "@/lib/apify";
import { logUsage } from "@/lib/api-usage";
import { scoreRelevance } from "@/lib/inspiration-query";

const FAILED_STATUSES = ["FAILED", "ABORTED", "TIMED-OUT", "TIMED_OUT"];

export type IngestResult = { status: string; errorMessage: string | null };

/**
 * Conclut une recherche Apify : interroge le statut du run, ingère les résultats si
 * terminé, retente une fois en cas d'échec. Ne fait rien (renvoie l'état actuel) si la
 * recherche n'est plus "en_cours" — protège contre webhook + polling + retries Apify.
 */
export async function ingestSearch(searchId: number): Promise<IngestResult> {
  const [search] = await db.select().from(inspirationSearches).where(eq(inspirationSearches.id, searchId));
  if (!search) return { status: "erreur", errorMessage: "Recherche introuvable." };

  if (search.status !== "en_cours" || !search.apifyRunId) {
    return { status: search.status, errorMessage: search.errorMessage };
  }

  try {
    const runStatus = await getApifyRunStatus(search.apifyRunId);

    if (runStatus === "SUCCEEDED") {
      const rawItems = await getApifyDatasetItems(search.apifyDatasetId!, search.maxItems);
      const source = search.source as ApifySource;
      const normalized = rawItems.map((r) => normalizeItem(source, r)).filter((n) => n.imageUrl);

      if (normalized.length > 0) {
        const inserted = await db
          .insert(inspirationItems)
          .values(
            normalized.map((n) => ({
              searchId: search.id,
              source,
              imageUrl: n.imageUrl,
              author: n.author,
              title: n.title,
              postedAt: n.postedAt,
              metrics: JSON.stringify(n.metrics),
              originalUrl: n.originalUrl,
            })),
          )
          .returning();
        const cost = Math.ceil((normalized.length * ACTORS[source].centsPer1000) / 1000);
        await logUsage("apify", source, cost);
        await db
          .update(inspirationSearches)
          .set({ status: "termine", costCents: cost })
          .where(eq(inspirationSearches.id, search.id));

        // Tri de pertinence Gemini — un seul appel pour tout le lot, dégrade silencieusement.
        await scoreRelevance(
          search.theme,
          inserted.map((it) => ({ id: it.id, title: it.title, author: it.author ?? "" })),
        );
      } else {
        await db
          .update(inspirationSearches)
          .set({
            status: "termine",
            costCents: 0,
            errorMessage: "Aucun résultat — essaie des mots-clés plus simples ou en anglais.",
          })
          .where(eq(inspirationSearches.id, search.id));
      }
    } else if (FAILED_STATUSES.includes(runStatus)) {
      if (search.retryCount === 0) {
        try {
          const { runId, datasetId } = await startApifyRun(search.source as ApifySource, search.theme, search.maxItems);
          await db
            .update(inspirationSearches)
            .set({ apifyRunId: runId, apifyDatasetId: datasetId, retryCount: 1 })
            .where(eq(inspirationSearches.id, search.id));
          return { status: "en_cours", errorMessage: null };
        } catch (e) {
          console.error("[apify] retry échoué", e);
          // Tombe dans le cas erreur ci-dessous.
        }
      }
      await db
        .update(inspirationSearches)
        .set({ status: "erreur", errorMessage: "La recherche d'inspiration a échoué. Réessaie dans quelques minutes." })
        .where(eq(inspirationSearches.id, search.id));
    } else {
      return { status: "en_cours", errorMessage: null };
    }
  } catch (e) {
    console.error("[apify] ingestion échouée", e);
    await db
      .update(inspirationSearches)
      .set({ status: "erreur", errorMessage: "La recherche d'inspiration est indisponible. Réessaie dans quelques minutes." })
      .where(eq(inspirationSearches.id, search.id));
  }

  const [updated] = await db.select().from(inspirationSearches).where(eq(inspirationSearches.id, search.id));
  return { status: updated.status, errorMessage: updated.errorMessage };
}

/**
 * Rattrape les recherches "en_cours" bloquées depuis plus de 10 minutes (page fermée
 * avant la fin, webhook jamais reçu). Appelée par le cron quotidien et au chargement
 * de l'onglet S'inspirer.
 */
export async function rattraperRecherchesBloquees(): Promise<number> {
  const seuil = new Date(Date.now() - 10 * 60 * 1000);
  const bloquees = await db.select().from(inspirationSearches).where(eq(inspirationSearches.status, "en_cours"));
  const aTraiter = bloquees.filter((s) => s.apifyRunId && s.createdAt < seuil);
  for (const s of aTraiter) {
    await ingestSearch(s.id);
  }
  return aTraiter.length;
}
