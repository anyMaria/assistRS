"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, timeSlots } from "@/db";

/**
 * Cycle au clic sur une cellule de la grille : rien → 1 → 2 → 3 → rien.
 * Un créneau modifié devient « personnalisé » (il prime sur le générique).
 */
export async function cycleSlot(
  platform: string,
  contentType: string,
  dayOfWeek: number,
  hour: number,
) {
  const existing = await db
    .select()
    .from(timeSlots)
    .where(
      and(
        eq(timeSlots.platform, platform),
        eq(timeSlots.contentType, contentType),
        eq(timeSlots.dayOfWeek, dayOfWeek),
        eq(timeSlots.hour, hour),
      ),
    );

  if (existing.length === 0) {
    await db.insert(timeSlots).values({
      platform,
      contentType,
      dayOfWeek,
      hour,
      strength: 1,
      source: "personnalise",
    });
  } else {
    const slot = existing[0];
    if (slot.strength >= 3) {
      await db.delete(timeSlots).where(eq(timeSlots.id, slot.id));
    } else {
      await db
        .update(timeSlots)
        .set({ strength: slot.strength + 1, source: "personnalise" })
        .where(eq(timeSlots.id, slot.id));
    }
  }
  revalidatePath("/programmation");
}
