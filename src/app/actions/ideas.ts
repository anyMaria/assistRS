"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ideas, publications, ideaNotes } from "@/db";
import { PLATFORMS } from "@/lib/constants";

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
  revalidatePath("/conception");
}

/** Créer l'idée puis la planifier immédiatement (bouton « Planifier tout de suite », G10). */
export async function creerEtPlanifierIdee(formData: FormData) {
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
  const [idea] = await db.insert(ideas).values(data).returning();
  if (!formData.get("platform")) {
    formData.set("platform", data.platform || PLATFORMS[0].value);
  }
  await planifierIdee(idea.id, formData);
}

export async function setIdeaStatus(id: number, status: string) {
  await db.update(ideas).set({ status }).where(eq(ideas.id, id));
  revalidatePath("/idees");
  revalidatePath("/conception");
}

export async function deleteIdea(id: number) {
  await db.delete(ideas).where(eq(ideas.id, id));
  revalidatePath("/idees");
  revalidatePath("/conception");
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
  revalidatePath("/conception");
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
  revalidatePath("/conception");
  revalidatePath("/planning");
  revalidatePath("/");
}

// ——— Pense-bête d'idées (G12) — notes rapides, étape amont d'une vraie idée ———

export async function addIdeaNote(formData: FormData) {
  const content = formData.get("content")?.toString().trim();
  if (!content) return;
  const accountIdRaw = formData.get("accountId")?.toString();
  await db.insert(ideaNotes).values({
    content,
    accountId: accountIdRaw ? Number(accountIdRaw) : null,
  });
  revalidatePath("/idees");
  revalidatePath("/conception");
}

export async function deleteIdeaNote(id: number) {
  await db.delete(ideaNotes).where(eq(ideaNotes.id, id));
  revalidatePath("/idees");
  revalidatePath("/conception");
}

/** « → En faire une idée » : crée l'idée à partir du contenu de la note, puis supprime la note. */
export async function convertNoteToIdea(id: number, formData: FormData) {
  const [note] = await db.select().from(ideaNotes).where(eq(ideaNotes.id, id));
  if (!note) return;
  await createIdea(formData);
  await db.delete(ideaNotes).where(eq(ideaNotes.id, id));
  revalidatePath("/idees");
  revalidatePath("/conception");
}
