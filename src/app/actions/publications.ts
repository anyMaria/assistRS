"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, isNotNull, lt } from "drizzle-orm";
import { z } from "zod";
import { db, publications, statSnapshots, ideas, publicationAssets } from "@/db";
import { insertDefaultSteps } from "@/lib/production-steps";
import { insertAssetIfMissing } from "@/lib/publication-assets";
import type { PublicationAsset } from "@/db/schema";

const pubSchema = z.object({
  accountId: z.coerce.number().int(),
  platform: z.string().min(1),
  format: z.string().min(1),
  title: z.string().default(""),
  status: z.enum(["planifiee", "publiee"]).default("planifiee"),
  plannedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  url: z.string().default(""),
  visualUrl: z.string().default(""),
  ideaId: z.coerce.number().int().optional(),
});

function toDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function parsePubForm(formData: FormData) {
  const data = pubSchema.parse({
    accountId: formData.get("accountId"),
    platform: formData.get("platform"),
    format: formData.get("format"),
    title: formData.get("title") ?? "",
    status: formData.get("status") ?? "planifiee",
    plannedAt: formData.get("plannedAt")?.toString() || undefined,
    publishedAt: formData.get("publishedAt")?.toString() || undefined,
    url: formData.get("url") ?? "",
    visualUrl: formData.get("visualUrl") ?? "",
    ideaId: formData.get("ideaId")?.toString() || undefined,
  });
  return {
    ...data,
    plannedAt: toDate(data.plannedAt),
    publishedAt: toDate(data.publishedAt),
    ideaId: data.ideaId ?? null,
  };
}

function revalidateAll() {
  revalidatePath("/planning");
  revalidatePath("/mesurer");
  revalidatePath("/");
}

export async function createPublication(formData: FormData) {
  const [pub] = await db.insert(publications).values(parsePubForm(formData)).returning();
  await insertDefaultSteps(pub.id);
  revalidateAll();
}

/** Copie une publication sans dates ni lien externe — titre suffixé « (copie) ». */
export async function duplicatePublication(id: number) {
  const [pub] = await db.select().from(publications).where(eq(publications.id, id));
  if (!pub) return;
  const [copy] = await db
    .insert(publications)
    .values({
      accountId: pub.accountId,
      platform: pub.platform,
      format: pub.format,
      title: pub.title ? `${pub.title} (copie)` : "(copie)",
      status: "planifiee",
      plannedAt: null,
      publishedAt: null,
      url: "",
      ideaId: pub.ideaId,
    })
    .returning();
  await insertDefaultSteps(copy.id);
  revalidateAll();
}

export async function updatePublication(id: number, formData: FormData) {
  await db.update(publications).set(parsePubForm(formData)).where(eq(publications.id, id));
  revalidateAll();
}

export async function setPublicationStatus(id: number, status: string) {
  const patch: Record<string, unknown> = { status };
  const [pub] = await db.select().from(publications).where(eq(publications.id, id));
  if (status === "publiee") {
    if (pub && !pub.publishedAt) patch.publishedAt = pub.plannedAt ?? new Date();
  }
  await db.update(publications).set(patch).where(eq(publications.id, id));
  // La publication ne met jamais à jour deux statuts à la main : l'idée liée suit.
  if (status === "publiee" && pub?.ideaId) {
    await db.update(ideas).set({ status: "publiee" }).where(eq(ideas.id, pub.ideaId));
    revalidatePath("/conception");
  }
  revalidateAll();
}

export async function deletePublication(id: number) {
  await purgeAssetsForPublication(id);
  await db.delete(publications).where(eq(publications.id, id));
  revalidateAll();
}

// ——— Visuels transitoires (G14) ———

/** Supprime les blobs d'une publication (le cascade DB ne supprime que les lignes, pas les fichiers). */
export async function purgeAssetsForPublication(publicationId: number): Promise<number> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return 0;
  const assets = await db.select().from(publicationAssets).where(eq(publicationAssets.publicationId, publicationId));
  if (assets.length === 0) return 0;
  const { del } = await import("@vercel/blob");
  for (const asset of assets) {
    try {
      await del(asset.pathname);
    } catch (e) {
      console.error("[blob] suppression échouée", e);
      // Un blob déjà absent ne doit pas stopper la purge.
    }
  }
  await db.delete(publicationAssets).where(eq(publicationAssets.publicationId, publicationId));
  return assets.length;
}

/**
 * Purge quotidienne (cron) : publications déjà envoyées à Buffer (`bufferPostId` non nul)
 * et planifiées il y a plus de 7 jours — Buffer a déjà copié les médias chez lui, nos
 * blobs transitoires ne servent plus à rien.
 */
export async function purgerAssetsExpires(): Promise<number> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return 0;
  const seuil = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const candidates = await db
    .select()
    .from(publications)
    .where(and(isNotNull(publications.bufferPostId), lt(publications.plannedAt, seuil)));

  let total = 0;
  for (const pub of candidates) {
    total += await purgeAssetsForPublication(pub.id);
  }
  return total;
}

/** Repli côté client après `upload()` — en dev, `onUploadCompleted` n'est pas rappelé (URL non joignable). */
export async function enregistrerAssetSecours(
  publicationId: number,
  url: string,
  pathname: string,
  sizeBytes: number,
): Promise<{ ok: true; asset: PublicationAsset } | { ok: false; error: string }> {
  try {
    const asset = await insertAssetIfMissing(publicationId, url, pathname, sizeBytes);
    revalidateAll();
    return { ok: true, asset };
  } catch (e) {
    console.error("[blob] enregistrement de secours échoué", e);
    return { ok: false, error: "L'enregistrement du visuel a échoué." };
  }
}

/** Réordonnance des visuels d'une publication — `ids` dans le nouvel ordre. */
export async function reordonnerAssets(ids: number[]) {
  await Promise.all(ids.map((id, position) => db.update(publicationAssets).set({ position }).where(eq(publicationAssets.id, id))));
  revalidateAll();
}

/** Supprime un visuel : ligne + blob. */
export async function supprimerAsset(id: number) {
  const [asset] = await db.select().from(publicationAssets).where(eq(publicationAssets.id, id));
  if (!asset) return;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import("@vercel/blob");
      await del(asset.pathname);
    } catch (e) {
      console.error("[blob] suppression échouée", e);
    }
  }
  await db.delete(publicationAssets).where(eq(publicationAssets.id, id));
  revalidateAll();
}

/** Visuels d'une publication, triés pour l'affichage/carrousel. */
export async function listAssets(publicationId: number): Promise<PublicationAsset[]> {
  return db.select().from(publicationAssets).where(eq(publicationAssets.publicationId, publicationId)).orderBy(asc(publicationAssets.position));
}

/** Décline une publication vers une autre plateforme (CONCEPTION.md §4.4) : copie sans dates, brief/légende à adapter. */
export async function declinerPublication(id: number, formData: FormData) {
  const [pub] = await db.select().from(publications).where(eq(publications.id, id));
  if (!pub) return;
  const platform = formData.get("platform")?.toString();
  if (!platform) return;
  await db.insert(publications).values({
    accountId: pub.accountId,
    platform,
    format: pub.format,
    title: pub.title,
    status: "planifiee",
    plannedAt: null,
    publishedAt: null,
    url: "",
    visualUrl: "",
    caption: pub.caption,
    ideaId: pub.ideaId,
  });
  revalidateAll();
}

// ——— Relevés de statistiques ———

const snapshotSchema = z.object({
  publicationId: z.coerce.number().int(),
  impressions: z.coerce.number().int().min(0).default(0),
  reach: z.coerce.number().int().min(0).default(0),
  likes: z.coerce.number().int().min(0).default(0),
  comments: z.coerce.number().int().min(0).default(0),
  shares: z.coerce.number().int().min(0).default(0),
  saves: z.coerce.number().int().min(0).default(0),
  clicks: z.coerce.number().int().min(0).default(0),
  followersGained: z.coerce.number().int().default(0),
  conversions: z.coerce.number().int().min(0).default(0),
});

export async function addSnapshot(formData: FormData) {
  const keys = [
    "publicationId",
    "impressions",
    "reach",
    "likes",
    "comments",
    "shares",
    "saves",
    "clicks",
    "followersGained",
    "conversions",
  ] as const;
  const raw: Record<string, unknown> = {};
  for (const k of keys) raw[k] = formData.get(k)?.toString() || 0;
  const data = snapshotSchema.parse(raw);
  await db.insert(statSnapshots).values(data);
  revalidatePath("/mesurer");
  revalidatePath("/bilan");
  revalidatePath("/");
}

export async function deleteSnapshot(id: number) {
  await db.delete(statSnapshots).where(eq(statSnapshots.id, id));
  revalidatePath("/mesurer");
  revalidatePath("/bilan");
}
