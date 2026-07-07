"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, publications, statSnapshots, ideas } from "@/db";
import { insertDefaultSteps } from "@/lib/production-steps";

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
  await db.delete(publications).where(eq(publications.id, id));
  revalidateAll();
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
