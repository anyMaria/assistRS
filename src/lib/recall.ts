import { eq, inArray } from "drizzle-orm";
import { db, publications, ideas, statSnapshots } from "@/db";
import { engagementRate, latestSnapshots } from "@/lib/kpi";

// Recall déterministe (CONCEPTION.md §4.3) — AUCUN appel IA, AUCUN appel réseau externe :
// uniquement des requêtes sur la base locale, calculées côté serveur au rendu de la page.

const STOPWORDS = new Set([
  "dans",
  "pour",
  "avec",
  "cette",
  "cette",
  "sans",
  "mais",
  "tout",
  "tous",
  "toute",
  "toutes",
  "nous",
  "vous",
  "elle",
  "elles",
  "leur",
  "leurs",
  "notre",
  "votre",
  "comme",
  "plus",
  "moins",
  "vers",
  "chez",
  "être",
  "avoir",
  "fait",
  "faire",
  "quand",
  "donc",
  "alors",
]);

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function significantWords(text: string | null | undefined): string[] {
  if (!text) return [];
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type RecallMatch = {
  publicationId: number;
  title: string;
  platform: string;
  format: string;
  date: Date | null;
  rate: number;
  url: string;
};

/**
 * Cherche, parmi les anciennes publications de la marque, celle qui partage un mot
 * significatif avec les mots-clés fournis (thème, pilier) ET dont le dernier relevé
 * dépasse la médiane d'engagement de la marque. Retourne la meilleure correspondance.
 */
export async function findRecall(
  accountId: number,
  keywords: (string | null | undefined)[],
  excludePublicationId?: number,
): Promise<RecallMatch | null> {
  const targetWords = new Set(keywords.flatMap((k) => significantWords(k)));
  if (targetWords.size === 0) return null;

  const pubs = await db.select().from(publications).where(eq(publications.accountId, accountId));
  const relevant = pubs.filter((p) => p.id !== excludePublicationId);
  if (relevant.length === 0) return null;

  const accountIdeas = await db.select().from(ideas).where(eq(ideas.accountId, accountId));
  const ideaById = new Map(accountIdeas.map((i) => [i.id, i]));

  const pubIds = relevant.map((p) => p.id);
  const snaps = await db.select().from(statSnapshots).where(inArray(statSnapshots.publicationId, pubIds));
  const latest = latestSnapshots(snaps);

  const rates = [...latest.values()]
    .map((s) => engagementRate(s))
    .filter((r): r is number => r !== null);
  const engagementMedian = median(rates);

  let best: RecallMatch | null = null;

  for (const pub of relevant) {
    const snap = latest.get(pub.id);
    if (!snap) continue;
    const rate = engagementRate(snap);
    if (rate === null || rate <= engagementMedian) continue;

    const linkedIdea = pub.ideaId ? ideaById.get(pub.ideaId) : undefined;
    const words = new Set([...significantWords(pub.title), ...significantWords(linkedIdea?.pillar)]);
    const shared = [...words].some((w) => targetWords.has(w));
    if (!shared) continue;

    if (!best || rate > best.rate) {
      best = {
        publicationId: pub.id,
        title: pub.title || "Sans titre",
        platform: pub.platform,
        format: pub.format,
        date: pub.publishedAt ?? pub.plannedAt,
        rate,
        url: pub.url ?? "",
      };
    }
  }

  return best;
}
