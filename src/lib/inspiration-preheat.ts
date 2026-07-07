// Pré-chauffe hebdomadaire (G13 §4) : le lundi, le cron lance des recherches Pinterest
// par pilier de marque pour que les résultats soient déjà là quand Ana ouvre S'inspirer.
import { and, desc, eq, gte } from "drizzle-orm";
import { db, accounts, brandEditorial, inspirationSearches } from "@/db";
import { normalizeQuery, startApifyRun, CACHE_DAYS, BUDGET_SOFT_LIMIT_CENTS } from "@/lib/apify";
import { optimizeQuery } from "@/lib/inspiration-query";
import { monthlySpendCents } from "@/lib/api-usage";

const MAX_CRON_SEARCHES_PER_WEEK = 6;
const PINTEREST_MAX_ITEMS = 30;

/** Vrai si un résultat frais existe déjà, OU si une recherche est déjà en cours pour ce
 * thème — évite de relancer un doublon pendant qu'un run précédent (~100 s) tourne encore. */
async function hasFreshCache(normalizedTheme: string): Promise<boolean> {
  const since = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(inspirationSearches)
    .where(
      and(
        eq(inspirationSearches.normalizedTheme, normalizedTheme),
        eq(inspirationSearches.source, "pinterest"),
        gte(inspirationSearches.createdAt, since),
      ),
    )
    .orderBy(desc(inspirationSearches.createdAt))
    .limit(1);
  const latest = rows[0];
  return latest && (latest.status === "termine" || latest.status === "en_cours");
}

async function cronSearchesThisWeek(): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(inspirationSearches)
    .where(and(eq(inspirationSearches.origin, "cron"), gte(inspirationSearches.createdAt, since)));
  return rows.length;
}

/**
 * Lance des recherches Pinterest "cron" sur les piliers de chaque marque, dans la limite
 * du cache, du plafond hebdo et du budget mensuel. Les résultats arrivent par le webhook
 * Apify — cette fonction ne poll rien.
 */
export async function preChaufferSuggestions(): Promise<number> {
  const spend = await monthlySpendCents("apify");
  if (spend >= BUDGET_SOFT_LIMIT_CENTS) {
    console.log("[cron] pré-chauffe suggestions annulée — budget Apify presque atteint");
    return 0;
  }

  let launched = await cronSearchesThisWeek();
  if (launched >= MAX_CRON_SEARCHES_PER_WEEK) return 0;

  const editorials = await db.select().from(brandEditorial);
  const accountRows = await db.select().from(accounts);
  const accountById = new Map(accountRows.map((a) => [a.id, a]));

  let count = 0;
  for (const ed of editorials) {
    if (launched >= MAX_CRON_SEARCHES_PER_WEEK) break;
    if (!accountById.has(ed.accountId)) continue;

    let pillars: { name: string }[] = [];
    try {
      pillars = JSON.parse(ed.pillars || "[]");
    } catch {
      continue;
    }

    for (const pillar of pillars) {
      if (launched >= MAX_CRON_SEARCHES_PER_WEEK) break;
      if (!pillar.name?.trim()) continue;

      const spendNow = await monthlySpendCents("apify");
      if (spendNow >= BUDGET_SOFT_LIMIT_CENTS) {
        console.log("[cron] pré-chauffe suggestions arrêtée en cours — budget Apify atteint");
        return count;
      }

      const normalizedTheme = normalizeQuery(pillar.name);
      if (await hasFreshCache(normalizedTheme)) continue;

      try {
        const optimizedQuery = await optimizeQuery(pillar.name, "pinterest", ed.accountId).catch(() => normalizedTheme);
        const { runId, datasetId, queryUsed } = await startApifyRun("pinterest", pillar.name, PINTEREST_MAX_ITEMS, optimizedQuery);
        await db.insert(inspirationSearches).values({
          theme: pillar.name,
          normalizedTheme,
          accountId: ed.accountId,
          source: "pinterest",
          periode: "toutes",
          tri: "recent",
          maxItems: PINTEREST_MAX_ITEMS,
          status: "en_cours",
          apifyRunId: runId,
          apifyDatasetId: datasetId,
          queryUsed,
          origin: "cron",
        });
        launched += 1;
        count += 1;
      } catch (e) {
        console.error("[cron] pré-chauffe : démarrage recherche échoué", e);
      }
    }
  }
  return count;
}
