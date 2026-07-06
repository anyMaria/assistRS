"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ideas } from "@/db";

const ideaSchema = z.object({
  accountId: z.coerce.number().int(),
  theme: z.string().min(1),
  title: z.string().min(1),
  format: z.string().default("post"),
  platform: z.string().default(""),
  content: z.string().default(""),
  status: z.enum(["idee", "en_production", "publiee"]).default("idee"),
  source: z.enum(["ia", "manuelle"]).default("manuelle"),
});

export async function createIdea(formData: FormData) {
  const data = ideaSchema.parse({
    accountId: formData.get("accountId"),
    theme: formData.get("theme") || formData.get("title"),
    title: formData.get("title"),
    format: formData.get("format") ?? "post",
    platform: formData.get("platform") ?? "",
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
