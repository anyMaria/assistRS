// Synchro des métriques Buffer → stat_snapshots (G11). API Buffer en Preview :
// isolé dans src/lib/buffer.ts, ce module ne dépend que du type BufferPostMetrics normalisé.
import { desc, eq, isNotNull } from "drizzle-orm";
import { db, publications, statSnapshots } from "@/db";
import { getPostMetrics } from "@/lib/buffer";
import { logUsage } from "@/lib/api-usage";

export type SyncResult = { created: number; errors: number };

/**
 * Pour chaque publication publiée avec `bufferPostId`, crée un nouveau relevé si les
 * métriques Buffer sont plus récentes que le dernier relevé existant — idempotent :
 * relancer sans nouvelles métriques ne crée rien.
 */
export async function synchroniserStatsBuffer(): Promise<SyncResult> {
  const pubs = await db
    .select()
    .from(publications)
    .where(isNotNull(publications.bufferPostId));
  const withBuffer = pubs.filter((p) => p.status === "publiee" && p.bufferPostId);
  if (withBuffer.length === 0) return { created: 0, errors: 0 };

  const metricsResult = await getPostMetrics(withBuffer.map((p) => p.bufferPostId!));
  if (!metricsResult.ok) {
    console.error("[buffer-sync] récupération des métriques échouée", metricsResult.error);
    return { created: 0, errors: withBuffer.length };
  }

  const metricsByPostId = new Map(metricsResult.data.map((m) => [m.postId, m]));
  let created = 0;
  let errors = 0;

  for (const pub of withBuffer) {
    const metrics = metricsByPostId.get(pub.bufferPostId!);
    if (!metrics || !metrics.metricsUpdatedAt) continue;

    try {
      const [lastSnapshot] = await db
        .select()
        .from(statSnapshots)
        .where(eq(statSnapshots.publicationId, pub.id))
        .orderBy(desc(statSnapshots.recordedAt))
        .limit(1);

      if (lastSnapshot && lastSnapshot.recordedAt >= metrics.metricsUpdatedAt) continue;

      await db.insert(statSnapshots).values({
        publicationId: pub.id,
        recordedAt: metrics.metricsUpdatedAt,
        impressions: metrics.impressions,
        reach: metrics.reach,
        likes: metrics.reactions,
        comments: metrics.comments,
        shares: metrics.shares,
        saves: metrics.saves,
        clicks: metrics.clicks,
        followersGained: metrics.follows,
        conversions: 0, // reste manuel — Buffer ne le fournit pas
      });
      created += 1;
    } catch (e) {
      console.error("[buffer-sync] relevé échoué pour la publication", pub.id, e);
      errors += 1;
    }
  }

  await logUsage("buffer", "synchro-stats", 0);
  return { created, errors };
}
