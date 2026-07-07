// Intégration Apify — S'inspirer (G3). Un seul point d'entrée pour les 5 sources.
// Tarifs vérifiés juillet 2026 (CONCEPTION.md §5.2). Le schéma Pinterest est vérifié en
// réel ; les autres sont indicatifs (à re-vérifier sur apify.com avant usage intensif).

const APIFY_BASE = "https://api.apify.com/v2";

export const ACTORS = {
  pinterest: {
    id: "easyapi~pinterest-search-scraper",
    label: "Pinterest",
    centsPer1000: 299,
    minItems: 20,
    maxItems: 30,
    costLabel: "~0,09 $ / 30 résultats",
    defaultChecked: true,
  },
  instagram: {
    id: "apify~instagram-scraper",
    label: "Instagram",
    centsPer1000: 270,
    minItems: 10,
    maxItems: 30,
    costLabel: "~0,08 $ / 30 résultats",
    defaultChecked: false,
  },
  linkedin: {
    id: "harvestapi~linkedin-post-search",
    label: "LinkedIn (posts)",
    centsPer1000: 200,
    minItems: 10,
    maxItems: 30,
    costLabel: "~0,06 $ / 30 résultats",
    defaultChecked: false,
  },
  facebook: {
    id: "apify~facebook-posts-scraper",
    label: "Facebook",
    centsPer1000: 800,
    minItems: 10,
    maxItems: 30,
    costLabel: "~0,15-0,24 $ / 30 résultats",
    defaultChecked: false,
  },
  metaAds: {
    id: "whoareyouanas~meta-ad-scraper",
    label: "Meta Ad Library",
    centsPer1000: 1000,
    minItems: 10,
    maxItems: 20,
    costLabel: "~0,30 $ / 20 résultats — le plus cher",
    defaultChecked: false,
  },
} as const;

export type ApifySource = keyof typeof ACTORS;
export const APIFY_SOURCES = Object.keys(ACTORS) as ApifySource[];

export const CACHE_DAYS = 14;
export const BUDGET_SOFT_LIMIT_CENTS = 450;
export const BUDGET_MONTHLY_CAP_CENTS = 500;

/** Retire accents/casse et limite à 3 mots — les requêtes longues/accentuées rendent 0 résultat. */
export function normalizeQuery(theme: string): string {
  return theme
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
}

function buildActorInput(source: ApifySource, query: string, maxItems: number): object {
  switch (source) {
    case "pinterest":
      return { query, limit: Math.max(20, maxItems), filter: "all" };
    case "instagram":
      return { search: query, searchType: "hashtag", resultsType: "posts", resultsLimit: maxItems };
    case "linkedin":
      return { searchQueries: [query], maxItems };
    case "facebook":
      return { searchQuery: query, maxPosts: maxItems };
    case "metaAds":
      return { searchTerms: query, country: "FR", maxItems };
  }
}

/** Démarre un run asynchrone (un run Apify dure ~100 s, trop long pour une fonction Vercel). */
export async function startApifyRun(
  source: ApifySource,
  theme: string,
  maxItems: number,
): Promise<{ runId: string; datasetId: string }> {
  if (!process.env.APIFY_TOKEN) throw new Error("APIFY_TOKEN manquant");
  const { id } = ACTORS[source];
  const query = normalizeQuery(theme);
  const input = buildActorInput(source, query, maxItems);
  const res = await fetch(`${APIFY_BASE}/acts/${id}/runs?token=${process.env.APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify ${source} : démarrage impossible (HTTP ${res.status})`);
  const json = await res.json();
  return { runId: json.data.id as string, datasetId: json.data.defaultDatasetId as string };
}

export async function getApifyRunStatus(runId: string): Promise<string> {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${process.env.APIFY_TOKEN}`);
  if (!res.ok) throw new Error(`Apify : statut indisponible (HTTP ${res.status})`);
  const json = await res.json();
  return json.data.status as string; // READY | RUNNING | SUCCEEDED | FAILED | ABORTED | TIMED-OUT
}

export async function getApifyDatasetItems(
  datasetId: string,
  limit: number,
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`Apify : résultats indisponibles (HTTP ${res.status})`);
  return (await res.json()) as Record<string, unknown>[];
}

export type NormalizedItem = {
  imageUrl: string;
  author: string;
  postedAt: Date | null;
  metrics: Record<string, unknown>;
  originalUrl: string;
};

/** Normalise un item brut Apify vers le format commun `inspiration_items`. */
export function normalizeItem(source: ApifySource, raw: Record<string, unknown>): NormalizedItem {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

  switch (source) {
    case "pinterest": {
      const owner = (raw.owner ?? {}) as Record<string, unknown>;
      return {
        imageUrl: str(raw.coverURL) || str(raw.thumbnailURL),
        author: str(owner.fullName) || str(owner.username),
        postedAt: null,
        metrics: { pinCount: num(raw.pinCount), followers: num(owner.followers), type: str(raw.type) || "pin" },
        originalUrl: str(raw.slashURL),
      };
    }
    case "instagram": {
      const timestamp = raw.timestamp ?? raw.takenAtTimestamp;
      return {
        imageUrl: str(raw.displayUrl) || str(raw.imageUrl),
        author: str(raw.ownerUsername),
        postedAt: timestamp ? new Date(timestamp as string | number) : null,
        metrics: { likes: num(raw.likesCount), comments: num(raw.commentsCount) },
        originalUrl: str(raw.url),
      };
    }
    case "linkedin": {
      const author = (raw.author ?? {}) as Record<string, unknown>;
      return {
        imageUrl: str(raw.imageUrl) || str((raw.image as Record<string, unknown> | undefined)?.url),
        author: str(author.name) || str(raw.authorName),
        postedAt: raw.postedAt ? new Date(raw.postedAt as string) : null,
        metrics: { reactions: num(raw.numReactions ?? raw.reactionsCount) },
        originalUrl: str(raw.url ?? raw.postUrl),
      };
    }
    case "facebook": {
      return {
        imageUrl: str(raw.imageUrl) || str((raw.media as Record<string, unknown>[] | undefined)?.[0]),
        author: str(raw.pageName) || str(raw.user),
        postedAt: raw.time ? new Date(raw.time as string) : null,
        metrics: { likes: num(raw.likes), comments: num(raw.comments), shares: num(raw.shares) },
        originalUrl: str(raw.url ?? raw.postUrl),
      };
    }
    case "metaAds": {
      const start = raw.adDeliveryStartTime ?? raw.startDate;
      const daysRunning = start
        ? Math.max(0, Math.round((Date.now() - new Date(start as string).getTime()) / 86_400_000))
        : null;
      return {
        imageUrl: str(raw.imageUrl) || str(raw.snapshotUrl),
        author: str(raw.pageName),
        postedAt: start ? new Date(start as string) : null,
        metrics: { daysRunning },
        originalUrl: str(raw.adUrl ?? raw.url),
      };
    }
  }
}

/** Signal de performance à afficher, propre à chaque source (CONCEPTION.md §5.2). */
export function signalText(source: ApifySource, metrics: Record<string, unknown>): string {
  const fr = (n: unknown) => Number(n ?? 0).toLocaleString("fr-FR");
  switch (source) {
    case "pinterest":
      return `épinglé ${fr(metrics.pinCount)} fois`;
    case "instagram":
      return `${fr(metrics.likes)} j'aime · ${fr(metrics.comments)} comm.`;
    case "linkedin":
      return `${fr(metrics.reactions)} réactions`;
    case "facebook":
      return `${fr(metrics.likes)} j'aime`;
    case "metaAds":
      return metrics.daysRunning !== null && metrics.daysRunning !== undefined
        ? `diffusée depuis ${fr(metrics.daysRunning)} j`
        : "durée inconnue";
  }
}
