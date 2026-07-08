"use server";

import { asc, eq } from "drizzle-orm";
import { db, publications, accounts, publicationAssets } from "@/db";
import { listChannels, createPost, type BufferPostType } from "@/lib/buffer";
import { logUsage } from "@/lib/api-usage";
import { platformLabel } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export type EnvoyerBufferResult = { ok: true; warning?: string } | { ok: false; error: string };

/** carrousel (FR, ce projet) → carousel (enum Buffer) ; reel/story/post inchangés. */
function toBufferPostType(format: string): BufferPostType {
  return format === "carrousel" ? "carousel" : (format as BufferPostType);
}

/** Envoie une publication planifiée directement sur Buffer, sur le canal de la même plateforme. */
export async function envoyerSurBuffer(id: number): Promise<EnvoyerBufferResult> {
  const [pub] = await db.select().from(publications).where(eq(publications.id, id));
  if (!pub) return { ok: false, error: "Publication introuvable." };
  const [account] = await db.select().from(accounts).where(eq(accounts.id, pub.accountId));

  const assets = await db
    .select()
    .from(publicationAssets)
    .where(eq(publicationAssets.publicationId, id))
    .orderBy(asc(publicationAssets.position));
  const imageUrls = assets.length > 0 ? assets.map((a) => a.url) : pub.visualUrl ? [pub.visualUrl] : [];

  if (pub.platform === "instagram" && imageUrls.length === 0) {
    return { ok: false, error: "Instagram exige un visuel — ajoute un visuel avant d'envoyer." };
  }
  if (imageUrls.length > 10) {
    return { ok: false, error: "Instagram accepte 10 images maximum." };
  }

  let warning: string | undefined;
  if (pub.format === "carrousel" && imageUrls.length < 2) {
    warning = `Un carrousel Buffer attend 2 à 10 images — envoyé avec ${imageUrls.length}.`;
  }

  const channelsResult = await listChannels();
  if (!channelsResult.ok) return channelsResult;

  const channel = channelsResult.data.find((c) => c.service === pub.platform);
  if (!channel) {
    return {
      ok: false,
      error: `Aucun canal ${platformLabel(pub.platform)} connecté sur ce compte Buffer.`,
    };
  }

  const text = pub.caption || pub.title || `Publication ${account?.name ?? ""}`.trim();
  const result = await createPost({
    channelId: channel.id,
    service: channel.service,
    text,
    dueAt: pub.plannedAt,
    imageUrls,
    postType: toBufferPostType(pub.format),
  });
  if (!result.ok) return result;

  await db.update(publications).set({ bufferPostId: result.data.id }).where(eq(publications.id, id));
  await logUsage("buffer", "envoi-publication", 0);
  revalidatePath("/planning");
  return { ok: true, warning };
}

export type LigneRapportBuffer = { id: number; label: string; ok: boolean; message: string };

/**
 * Envoie plusieurs publications sur Buffer séquentiellement (pas de Promise.all — rate
 * limit Buffer inconnu), continue même en cas d'échec d'une ligne (G14 §5).
 */
export async function envoyerSemaineSurBuffer(ids: number[]): Promise<LigneRapportBuffer[]> {
  const rapport: LigneRapportBuffer[] = [];
  for (const id of ids) {
    const [pub] = await db.select().from(publications).where(eq(publications.id, id));
    const label = pub?.title || `Publication #${id}`;
    const res = await envoyerSurBuffer(id);
    rapport.push({
      id,
      label,
      ok: res.ok,
      message: res.ok ? res.warning ?? "Envoyée." : res.error,
    });
  }
  revalidatePath("/planning");
  return rapport;
}
