import type { StatSnapshot } from "@/db/schema";

/**
 * KPI déterministes.
 * Taux d'engagement = (j'aime + commentaires + partages + enregistrements) / portée.
 */

export function interactions(s: StatSnapshot): number {
  return s.likes + s.comments + s.shares + s.saves;
}

export function engagementRate(s: StatSnapshot): number | null {
  if (!s.reach) return null;
  return interactions(s) / s.reach;
}

export function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1).replace(".", ",")} %`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

/** Dernier relevé par publication (les stats évoluent, on compare sur le plus récent). */
export function latestSnapshots(snapshots: StatSnapshot[]): Map<number, StatSnapshot> {
  const byPub = new Map<number, StatSnapshot>();
  for (const s of snapshots) {
    const current = byPub.get(s.publicationId);
    if (!current || s.recordedAt > current.recordedAt) {
      byPub.set(s.publicationId, s);
    }
  }
  return byPub;
}

export type Aggregate = {
  count: number;
  impressions: number;
  reach: number;
  interactions: number;
  followersGained: number;
  conversions: number;
  engagementRate: number | null;
};

/** Agrège une liste de derniers relevés (une entrée par publication). */
export function aggregate(snaps: StatSnapshot[]): Aggregate {
  const total = snaps.reduce(
    (acc, s) => {
      acc.impressions += s.impressions;
      acc.reach += s.reach;
      acc.interactions += interactions(s);
      acc.followersGained += s.followersGained;
      acc.conversions += s.conversions;
      return acc;
    },
    { impressions: 0, reach: 0, interactions: 0, followersGained: 0, conversions: 0 },
  );
  return {
    count: snaps.length,
    ...total,
    engagementRate: total.reach ? total.interactions / total.reach : null,
  };
}
