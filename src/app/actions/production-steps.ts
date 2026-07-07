"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, productionSteps } from "@/db";

export async function toggleStep(publicationId: number, key: string) {
  const [step] = await db
    .select()
    .from(productionSteps)
    .where(and(eq(productionSteps.publicationId, publicationId), eq(productionSteps.key, key)));
  if (!step) return;
  const done = !step.done;
  await db
    .update(productionSteps)
    .set({ done, doneAt: done ? new Date() : null })
    .where(eq(productionSteps.id, step.id));
  revalidatePath("/planning");
  revalidatePath("/statistiques");
  revalidatePath("/");
}
