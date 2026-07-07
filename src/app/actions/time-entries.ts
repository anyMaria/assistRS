"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, timeEntries } from "@/db";

const timeEntrySchema = z.object({
  accountId: z.coerce.number().int(),
  publicationId: z.coerce.number().int().optional(),
  minutes: z.coerce.number().int().positive(),
  note: z.string().default(""),
});

function revalidateAll() {
  revalidatePath("/analyse");
  revalidatePath("/planning");
}

export async function createTimeEntry(formData: FormData) {
  const data = timeEntrySchema.parse({
    accountId: formData.get("accountId"),
    publicationId: formData.get("publicationId")?.toString() || undefined,
    minutes: formData.get("minutes"),
    note: formData.get("note") ?? "",
  });
  await db.insert(timeEntries).values({ ...data, publicationId: data.publicationId ?? null });
  revalidateAll();
}

export async function deleteTimeEntry(id: number) {
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
  revalidateAll();
}
