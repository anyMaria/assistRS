// Agrégation des relevés en séries temporelles pour les graphiques de /mesurer (G11 §3).
import type { Publication, StatSnapshot } from "@/db/schema";
import { PLATFORMS } from "@/lib/constants";
import { engagementRate } from "@/lib/kpi";

export const PERIODS = [
  { value: "30j", label: "30 derniers jours", days: 30 },
  { value: "90j", label: "90 derniers jours", days: 90 },
  { value: "12mois", label: "12 derniers mois", days: 365 },
] as const;
export type PeriodValue = (typeof PERIODS)[number]["value"];

function periodDays(period: string): number {
  return PERIODS.find((p) => p.value === period)?.days ?? 90;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Clé de tri chronologique (ISO) + libellé français d'un bucket : semaine (≤ 90 j) ou mois. */
function bucket(date: Date, weekly: boolean): { sortKey: string; label: string } {
  if (weekly) {
    const monday = new Date(date);
    const day = (monday.getDay() + 6) % 7; // 0 = lundi
    monday.setDate(monday.getDate() - day);
    return {
      sortKey: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
      label: monday.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    };
  }
  return {
    sortKey: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`,
    label: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
  };
}

export type EngagementPoint = { periode: string } & Record<string, number | string>;

/** Une courbe par plateforme : taux d'engagement moyen (%) par bucket temporel. */
export function buildEngagementSeries(
  pubs: Publication[],
  snaps: StatSnapshot[],
  period: string,
): EngagementPoint[] {
  const days = periodDays(period);
  const weekly = days <= 90;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const pubById = new Map(pubs.map((p) => [p.id, p]));

  // sortKey -> { label, platforms: { [platform]: { sum, count } } }
  const buckets = new Map<string, { label: string; platforms: Map<string, { sum: number; count: number }> }>();

  for (const s of snaps) {
    if (s.recordedAt < since) continue;
    const pub = pubById.get(s.publicationId);
    if (!pub) continue;
    const rate = engagementRate(s);
    if (rate === null) continue;
    const { sortKey, label } = bucket(s.recordedAt, weekly);
    if (!buckets.has(sortKey)) buckets.set(sortKey, { label, platforms: new Map() });
    const entry = buckets.get(sortKey)!;
    const cur = entry.platforms.get(pub.platform) ?? { sum: 0, count: 0 };
    cur.sum += rate * 100;
    cur.count += 1;
    entry.platforms.set(pub.platform, cur);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { label, platforms }]) => {
      const point: EngagementPoint = { periode: label };
      for (const platform of PLATFORMS) {
        const v = platforms.get(platform.value);
        if (v) point[platform.value] = Math.round((v.sum / v.count) * 10) / 10;
      }
      return point;
    });
}

export type ReachPoint = { periode: string; valeur: number };

/** Barres : somme d'une métrique (reach | followersGained) par bucket temporel. */
export function buildMetricSeries(
  pubs: Publication[],
  snaps: StatSnapshot[],
  period: string,
  metric: "reach" | "followersGained",
): ReachPoint[] {
  const days = periodDays(period);
  const weekly = days <= 90;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const pubIds = new Set(pubs.map((p) => p.id));

  const buckets = new Map<string, { label: string; valeur: number }>();
  for (const s of snaps) {
    if (s.recordedAt < since || !pubIds.has(s.publicationId)) continue;
    const { sortKey, label } = bucket(s.recordedAt, weekly);
    const entry = buckets.get(sortKey) ?? { label, valeur: 0 };
    entry.valeur += s[metric];
    buckets.set(sortKey, entry);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { label, valeur }]) => ({ periode: label, valeur }));
}

export type TrendPoint = { periode: string; engagement: number | null; reach: number };

/**
 * Série globale (toutes marques/plateformes confondues) pour les sparklines de
 * l'accueil : engagement moyen (%) et portée cumulée, par semaine sur `days` jours.
 */
export function buildGlobalTrend(snaps: StatSnapshot[], days: number): TrendPoint[] {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const buckets = new Map<string, { label: string; sumRate: number; countRate: number; reach: number }>();
  for (const s of snaps) {
    if (s.recordedAt < since) continue;
    const { sortKey, label } = bucket(s.recordedAt, true);
    const entry = buckets.get(sortKey) ?? { label, sumRate: 0, countRate: 0, reach: 0 };
    const rate = engagementRate(s);
    if (rate !== null) {
      entry.sumRate += rate * 100;
      entry.countRate += 1;
    }
    entry.reach += s.reach;
    buckets.set(sortKey, entry);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { label, sumRate, countRate, reach }]) => ({
      periode: label,
      engagement: countRate ? Math.round((sumRate / countRate) * 10) / 10 : null,
      reach,
    }));
}
