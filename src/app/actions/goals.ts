"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, goals } from "@/db";

const goalSchema = z.object({
  accountId: z.coerce.number().int(),
  metric: z.enum(["abonnes", "engagement", "conversions"]),
  target: z.coerce.number().int().positive(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

function revalidateAll() {
  revalidatePath("/bilan");
  revalidatePath("/");
}

export async function createGoal(formData: FormData) {
  const data = goalSchema.parse({
    accountId: formData.get("accountId"),
    metric: formData.get("metric"),
    target: formData.get("target"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
  });
  await db.insert(goals).values(data);
  revalidateAll();
}

export async function deleteGoal(id: number) {
  await db.delete(goals).where(eq(goals.id, id));
  revalidateAll();
}
