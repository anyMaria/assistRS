"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, colorRules, viewConfigs, csvMappings } from "@/db";

// ——— Règles de couleurs conditionnelles ———

const ruleSchema = z.object({
  entity: z.enum(["idees", "publications"]),
  field: z.string().min(1),
  operator: z.enum(["egal", "different", "inferieur", "superieur"]),
  value: z.string().min(1),
  color: z.string().min(1),
  label: z.string().default(""),
});

function revalidateViews() {
  revalidatePath("/parametres");
  revalidatePath("/idees");
  revalidatePath("/planning");
}

export async function createColorRule(formData: FormData) {
  const data = ruleSchema.parse({
    entity: formData.get("entity"),
    field: formData.get("field"),
    operator: formData.get("operator"),
    value: formData.get("value"),
    color: formData.get("color"),
    label: formData.get("label") ?? "",
  });
  await db.insert(colorRules).values(data);
  revalidateViews();
}

export async function deleteColorRule(id: number) {
  await db.delete(colorRules).where(eq(colorRules.id, id));
  revalidateViews();
}

// ——— Vues sauvegardées ———

const viewSchema = z.object({
  entity: z.enum(["idees", "publications"]),
  name: z.string().min(1),
  type: z.enum(["table", "kanban", "calendrier"]),
  groupBy: z.string().default("status"),
});

export async function createView(formData: FormData) {
  const data = viewSchema.parse({
    entity: formData.get("entity"),
    name: formData.get("name"),
    type: formData.get("type"),
    groupBy: formData.get("groupBy") ?? "status",
  });
  await db.insert(viewConfigs).values({
    entity: data.entity,
    name: data.name,
    type: data.type,
    config: JSON.stringify(data.type === "kanban" ? { groupBy: data.groupBy } : {}),
  });
  revalidateViews();
}

export async function deleteView(id: number) {
  await db.delete(viewConfigs).where(eq(viewConfigs.id, id));
  revalidateViews();
}

// ——— Mappings CSV ———

export async function deleteCsvMapping(id: number) {
  await db.delete(csvMappings).where(eq(csvMappings.id, id));
  revalidatePath("/parametres");
  revalidatePath("/statistiques");
}
