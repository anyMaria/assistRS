import type { Publication, StatSnapshot } from "@/db/schema";
import { engagementRate } from "@/lib/kpi";

/** Seuil à partir duquel on propose de calculer des créneaux personnalisés. */
export const MIN_PUBS_FOR_ANALYSIS = 10;

export type SlotStat = { dayOfWeek: number; hour: number; avgRate: number; count: number; strength: number };

function formatToContentType(format: string): string {
  if (format === "reel") return "reel";
  if (format === "story") return "story";
  return "post"; // carrousel, post
}

/** Nombre de publications de la plateforme qui ont au moins un relevé. */
export function countStatsForPlatform(
  pubs: Publication[],
  latestSnapshotByPub: Map<number, StatSnapshot>,
  platform: string,
): number {
  return pubs.filter((p) => p.platform === platform && latestSnapshotByPub.has(p.id)).length;
}

/**
 * Agrège le taux d'engagement moyen par jour/heure de publication, groupé par type
 * de contenu (post/reel/story) pour rester comparable à la grille `time_slots`.
 */
export function computeRealSlots(
  pubs: Publication[],
  latestSnapshotByPub: Map<number, StatSnapshot>,
  platform: string,
): Map<string, SlotStat[]> {
  const byContentType = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const pub of pubs) {
    if (pub.platform !== platform) continue;
    const date = pub.publishedAt ?? pub.plannedAt;
    if (!date) continue;
    const snap = latestSnapshotByPub.get(pub.id);
    if (!snap) continue;
    const rate = engagementRate(snap);
    if (rate === null) continue;

    const contentType = formatToContentType(pub.format);
    const dayOfWeek = (date.getDay() + 6) % 7; // JS: 0=dimanche → 0=lundi
    const key = `${dayOfWeek}-${date.getHours()}`;
    const map = byContentType.get(contentType) ?? new Map();
    const cell = map.get(key) ?? { sum: 0, count: 0 };
    cell.sum += rate;
    cell.count += 1;
    map.set(key, cell);
    byContentType.set(contentType, map);
  }

  const result = new Map<string, SlotStat[]>();
  for (const [contentType, cells] of byContentType) {
    const list = [...cells.entries()]
      .map(([key, v]) => {
        const [d, h] = key.split("-").map(Number);
        return { dayOfWeek: d, hour: h, avgRate: v.sum / v.count, count: v.count };
      })
      .sort((a, b) => b.avgRate - a.avgRate);

    const n = list.length;
    const withStrength = list.map((s, i) => {
      const ratio = n <= 1 ? 0 : i / n;
      const strength = ratio < 0.34 ? 3 : ratio < 0.67 ? 2 : 1;
      return { ...s, strength };
    });
    result.set(contentType, withStrength);
  }
  return result;
}
