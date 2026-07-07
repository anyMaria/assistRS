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
  revalidatePath("/conception");
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
  type: z.enum(["table", "kanban", "calendrier", "galerie"]),
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

// ——— Réglages d'une vue : propriétés affichées, tri, filtres ———

function jsonArray(formData: FormData, key: string): unknown[] {
  const raw = formData.get(key)?.toString() || "[]";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const settingsSchema = z.object({
  groupBy: z.string().default("status"),
  sortBy: z.string().default(""),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

export async function updateViewSettings(id: number, formData: FormData) {
  const data = settingsSchema.parse({
    groupBy: formData.get("groupBy") ?? "status",
    sortBy: formData.get("sortBy") ?? "",
    sortDir: formData.get("sortDir") ?? "asc",
  });
  const displayProps = formData.getAll("displayProps").map(String);
  const filters = jsonArray(formData, "filters").filter(
    (f): f is { field: string; operator: string; value: string } =>
      !!f && typeof f === "object" && "field" in f && !!(f as { field?: string }).field,
  );
  await db
    .update(viewConfigs)
    .set({
      config: JSON.stringify({
        groupBy: data.groupBy,
        displayProps,
        sortBy: data.sortBy || undefined,
        sortDir: data.sortDir,
        filters,
      }),
    })
    .where(eq(viewConfigs.id, id));
  revalidateViews();
}

// ——— Mappings CSV ———

export async function deleteCsvMapping(id: number) {
  await db.delete(csvMappings).where(eq(csvMappings.id, id));
  revalidatePath("/parametres");
  revalidatePath("/mesurer");
}
