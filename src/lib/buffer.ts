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
