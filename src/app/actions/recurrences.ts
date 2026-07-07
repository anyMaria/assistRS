"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, recurrences } from "@/db";

const recurrenceSchema = z.object({
  accountId: z.coerce.number().int(),
  platform: z.string().min(1),
  format: z.string().min(1),
  titlePattern: z.string().min(1, "Le titre est requis"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  hour: z.coerce.number().int().min(0).max(23),
  freq: z.enum(["hebdo", "mensuel"]).default("hebdo"),
});

function revalidateAll() {
  revalidatePath("/planning");
  revalidatePath("/");
}

export async function createRecurrence(formData: FormData) {
  const data = recurrenceSchema.parse({
    accountId: formData.get("accountId"),
    platform: formData.get("platform"),
    format: formData.get("format"),
    titlePattern: formData.get("titlePattern"),
    dayOfWeek: formData.get("dayOfWeek"),
    hour: formData.get("hour"),
    freq: formData.get("freq") ?? "hebdo",
  });
  await db.insert(recurrences).values(data);
  revalidateAll();
}

export async function toggleRecurrenceActive(id: number) {
  const [rec] = await db.select().from(recurrences).where(eq(recurrences.id, id));
  if (!rec) return;
  await db.update(recurrences).set({ active: !rec.active }).where(eq(recurrences.id, id));
  revalidateAll();
}

export async function deleteRecurrence(id: number) {
  await db.delete(recurrences).where(eq(recurrences.id, id));
  revalidateAll();
}
