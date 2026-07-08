// Client Buffer unique — API GraphQL (developers.buffer.com), Publish API key.
// Auth par en-tête `Authorization: Bearer`. Un seul endpoint, tout passe en POST.
const BUFFER_API = "https://api.buffer.com";

export type BufferChannel = { id: string; service: string; displayName: string };

export type BufferResult<T> = { ok: true; data: T } | { ok: false; error: string };

function friendlyError(e: unknown): string {
  console.error("[buffer] appel échoué", e);
  return "Buffer est indisponible pour l'instant. Réessaie dans quelques minutes.";
}

/** null si BUFFER_ACCESS_TOKEN absente — permet l'échec propre sans planter au chargement du module. */
function getToken(): string | null {
  return process.env.BUFFER_ACCESS_TOKEN || null;
}

async function graphql<T>(token: string, query: string, variables?: object): Promise<BufferResult<T>> {
  try {
    const res = await fetch(BUFFER_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (!res.ok || json.errors?.length) {
      return { ok: false, error: friendlyError(json.errors ?? json) };
    }
    return { ok: true, data: json.data as T };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

/** Organisation Buffer de ce compte (on prend la première — usage personnel, un seul compte). */
async function getOrganizationId(token: string): Promise<BufferResult<string>> {
  const result = await graphql<{ account: { organizations: { id: string }[] } }>(
    token,
    `query GetOrganizations { account { organizations { id } } }`,
  );
  if (!result.ok) return result;
  const org = result.data.account.organizations[0];
  if (!org) return { ok: false, error: "Aucune organisation Buffer trouvée pour ce compte." };
  return { ok: true, data: org.id };
}

/** Canaux connectés (un par compte social relié à Buffer), avec leur plateforme (`service`). */
export async function listChannels(): Promise<BufferResult<BufferChannel[]>> {
  const token = getToken();
  if (!token) return { ok: false, error: "Buffer n'est pas configuré (BUFFER_ACCESS_TOKEN manquante)." };

  const orgResult = await getOrganizationId(token);
  if (!orgResult.ok) return orgResult;

  const result = await graphql<{ channels: BufferChannel[] }>(
    token,
    `query GetChannels($organizationId: OrganizationId!) {
      channels(input: { organizationId: $organizationId }) { id service displayName }
    }`,
    { organizationId: orgResult.data },
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.channels };
}

/** Type de post Buffer (facebook/instagram) — enum GraphQL `PostType`/`PostTypeFacebook`. */
export type BufferPostType = "post" | "reel" | "story" | "carousel";

/** Crée une publication Buffer (immédiate ou planifiée à une date précise) sur un canal.
 * `postType` + `service` sont requis par Facebook/Instagram (pas par LinkedIn). */
export async function createPost(params: {
  channelId: string;
  service: string;
  text: string;
  dueAt?: Date | null;
  imageUrls?: string[];
  postType?: BufferPostType;
}): Promise<BufferResult<{ id: string }>> {
  const token = getToken();
  if (!token) return { ok: false, error: "Buffer n'est pas configuré (BUFFER_ACCESS_TOKEN manquante)." };

  const metadata =
    params.postType && (params.service === "facebook" || params.service === "instagram")
      ? { [params.service]: { type: params.postType } }
      : undefined;

  const result = await graphql<{
    createPost: { post?: { id: string } } | { message: string };
  }>(
    token,
    `mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess { post { id } }
        ... on MutationError { message }
      }
    }`,
    {
      input: {
        channelId: params.channelId,
        text: params.text,
        schedulingType: "automatic",
        mode: params.dueAt ? "customScheduled" : "shareNow",
        ...(params.dueAt ? { dueAt: params.dueAt.toISOString() } : {}),
        ...(metadata ? { metadata } : {}),
        assets: (params.imageUrls ?? []).map((url) => ({ image: { url } })),
      },
    },
  );
  if (!result.ok) return result;

  const payload = result.data.createPost;
  if ("message" in payload) return { ok: false, error: friendlyError(payload.message) };
  if (!payload.post) return { ok: false, error: friendlyError(payload) };
  return { ok: true, data: { id: payload.post.id } };
}

/** Métriques normalisées d'un post Buffer (G11) — API `Post.metrics`, statut Preview :
 * les noms de champs peuvent changer, tout est isolé ici. */
export type BufferPostMetrics = {
  postId: string;
  impressions: number;
  reach: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  follows: number;
  engagementRate: number | null;
  metricsUpdatedAt: Date | null;
};

/** Récupère les métriques de plusieurs posts Buffer en une requête. */
export async function getPostMetrics(postIds: string[]): Promise<BufferResult<BufferPostMetrics[]>> {
  const token = getToken();
  if (!token) return { ok: false, error: "Buffer n'est pas configuré (BUFFER_ACCESS_TOKEN manquante)." };
  if (postIds.length === 0) return { ok: true, data: [] };

  const result = await graphql<{
    posts: {
      id: string;
      metricsUpdatedAt?: string | null;
      metrics?: {
        impressions?: number | null;
        reach?: number | null;
        reactions?: number | null;
        comments?: number | null;
        shares?: number | null;
        clicks?: number | null;
        saves?: number | null;
        follows?: number | null;
        engagementRate?: number | null;
      } | null;
    }[];
  }>(
    token,
    `query GetPostMetrics($ids: [PostId!]!) {
      posts(input: { ids: $ids }) {
        id
        metricsUpdatedAt
        metrics {
          impressions
          reach
          reactions
          comments
          shares
          clicks
          saves
          follows
          engagementRate
        }
      }
    }`,
    { ids: postIds },
  );
  if (!result.ok) return result;

  const data = result.data.posts.map((p) => ({
    postId: p.id,
    impressions: p.metrics?.impressions ?? 0,
    reach: p.metrics?.reach ?? 0,
    reactions: p.metrics?.reactions ?? 0,
    comments: p.metrics?.comments ?? 0,
    shares: p.metrics?.shares ?? 0,
    clicks: p.metrics?.clicks ?? 0,
    saves: p.metrics?.saves ?? 0,
    follows: p.metrics?.follows ?? 0,
    engagementRate: p.metrics?.engagementRate ?? null,
    metricsUpdatedAt: p.metricsUpdatedAt ? new Date(p.metricsUpdatedAt) : null,
  }));
  return { ok: true, data };
}
