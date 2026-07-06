"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ideas, publications } from "@/db";

const ideaSchema = z.object({
  accountId: z.coerce.number().int(),
  theme: z.string().default(""),
  title: z.string().min(1),
  format: z.string().default("post"),
  platform: z.string().default(""),
  pillar: z.string().default(""),
  feasibility: z.string().default(""),
  content: z.string().default(""),
  status: z.enum(["idee", "en_production", "publiee"]).default("idee"),
  source: z.enum(["ia", "manuelle"]).default("manuelle"),
});

export async function createIdea(formData: FormData) {
  const data = ideaSchema.parse({
    accountId: formData.get("accountId"),
    theme: formData.get("theme") || formData.get("pillar") || formData.get("title"),
    title: formData.get("title"),
    format: formData.get("format") ?? "post",
    platform: formData.get("platform") ?? "",
    pillar: formData.get("pillar") ?? "",
    feasibility: formData.get("feasibility") ?? "",
    content: formData.get("content") ?? "",
    status: formData.get("status") ?? "idee",
    source: formData.get("source") ?? "manuelle",
  });
  await db.insert(ideas).values(data);
  revalidatePath("/idees");
}

export async function setIdeaStatus(id: number, status: string) {
  await db.update(ideas).set({ status }).where(eq(ideas.id, id));
  revalidatePath("/idees");
}

export async function deleteIdea(id: number) {
  await db.delete(ideas).where(eq(ideas.id, id));
  revalidatePath("/idees");
}

export async function duplicateIdea(id: number) {
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
  if (!idea) return;
  await db.insert(ideas).values({
    accountId: idea.accountId,
    theme: idea.theme,
    title: `${idea.title} (copie)`,
    format: idea.format,
    platform: idea.platform,
    pillar: idea.pillar,
    feasibility: idea.feasibility,
    content: idea.content,
    status: "idee",
    source: idea.source,
  });
  revalidatePath("/idees");
}

const planSchema = z.object({
  platform: z.string().min(1),
  format: z.string().default("post"),
  plannedAt: z.string().optional(),
});

/** Transforme une idée en publication planifiée liée (ideaId) — ne met jamais à jour deux statuts à la main. */
export async function planifierIdee(id: number, formData: FormData) {
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
  if (!idea) return;
  const data = planSchema.parse({
    platform: formData.get("platform") ?? idea.platform,
    format: formData.get("format") ?? idea.format,
    plannedAt: formData.get("plannedAt")?.toString() || undefined,
  });
  await db.insert(publications).values({
    accountId: idea.accountId,
    platform: data.platform,
    format: data.format,
    title: idea.title,
    status: "planifiee",
    plannedAt: data.plannedAt ? new Date(data.plannedAt) : null,
    ideaId: idea.id,
  });
  await db.update(ideas).set({ status: "en_production" }).where(eq(ideas.id, id));
  revalidatePath("/idees");
  revalidatePath("/planning");
  revalidatePath("/");
}
