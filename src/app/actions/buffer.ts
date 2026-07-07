"use server";

import { eq } from "drizzle-orm";
import { db, publications, accounts } from "@/db";
import { listChannels, createPost, type BufferPostType } from "@/lib/buffer";
import { logUsage } from "@/lib/api-usage";
import { platformLabel } from "@/lib/constants";

export type EnvoyerBufferResult = { ok: true } | { ok: false; error: string };

/** carrousel (FR, ce projet) → carousel (enum Buffer) ; reel/story/post inchangés. */
function toBufferPostType(format: string): BufferPostType {
  return format === "carrousel" ? "carousel" : (format as BufferPostType);
}

/** Envoie une publication planifiée directement sur Buffer, sur le canal de la même plateforme. */
export async function envoyerSurBuffer(id: number): Promise<EnvoyerBufferResult> {
  const [pub] = await db.select().from(publications).where(eq(publications.id, id));
  if (!pub) return { ok: false, error: "Publication introuvable." };
  const [account] = await db.select().from(accounts).where(eq(accounts.id, pub.accountId));

  if (pub.platform === "instagram" && !pub.visualUrl) {
    return { ok: false, error: "Instagram exige un visuel — ajoute une URL de visuel avant d'envoyer." };
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
    imageUrl: pub.visualUrl || undefined,
    postType: toBufferPostType(pub.format),
  });
  if (!result.ok) return result;

  await logUsage("buffer", "envoi-publication", 0);
  return { ok: true };
}
