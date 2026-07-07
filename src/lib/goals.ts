import type { Goal, Publication, StatSnapshot } from "@/db/schema";
import { engagementRate } from "@/lib/kpi";

export type GoalProgress = { current: number; ratio: number };

/**
 * Valeur atteinte sur la période de l'objectif, à partir des relevés de la marque.
 * engagement : moyenne des taux d'engagement, exprimée en points de base (450 = 4,50 %).
 */
export function computeGoalProgress(
  goal: Goal,
  pubs: Publication[],
  snaps: StatSnapshot[],
): GoalProgress {
  const accountPubIds = new Set(
    pubs.filter((p) => p.accountId === goal.accountId).map((p) => p.id),
  );
  const periodSnaps = snaps.filter(
    (s) =>
      accountPubIds.has(s.publicationId) &&
      s.recordedAt >= goal.periodStart &&
      s.recordedAt <= goal.periodEnd,
  );

  let current = 0;
  if (goal.metric === "abonnes") {
    current = periodSnaps.reduce((sum, s) => sum + s.followersGained, 0);
  } else if (goal.metric === "conversions") {
    current = periodSnaps.reduce((sum, s) => sum + s.conversions, 0);
  } else if (goal.metric === "engagement") {
    const rates = periodSnaps.map(engagementRate).filter((r): r is number => r !== null);
    current = rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10000) : 0;
  }

  const ratio = goal.target > 0 ? Math.min(1, current / goal.target) : 0;
  return { current, ratio };
}

export function formatGoalValue(metric: string, value: number): string {
  if (metric === "engagement") return `${(value / 100).toFixed(1).replace(".", ",")} %`;
  return value.toLocaleString("fr-FR");
}
