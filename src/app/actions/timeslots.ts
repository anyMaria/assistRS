"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
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
  revalidatePath("/parametres");
}

const cellsSchema = z.array(
  z.object({ dayOfWeek: z.number().int().min(0).max(6), hour: z.number().int(), strength: z.number().int().min(1).max(3) }),
);

/**
 * Applique les créneaux personnalisés calculés à partir des vraies performances
 * (src/lib/schedule-analysis.ts) — upsert uniquement les cellules proposées, sans
 * toucher au reste de la grille (respecte les ajustements manuels d'Ana ailleurs).
 */
export async function applyPersonalizedSlots(platform: string, contentType: string, formData: FormData) {
  const raw = formData.get("cells");
  if (typeof raw !== "string") return;
  const cells = cellsSchema.parse(JSON.parse(raw));

  for (const cell of cells) {
    const existing = await db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.platform, platform),
          eq(timeSlots.contentType, contentType),
          eq(timeSlots.dayOfWeek, cell.dayOfWeek),
          eq(timeSlots.hour, cell.hour),
        ),
      );
    if (existing.length === 0) {
      await db.insert(timeSlots).values({
        platform,
        contentType,
        dayOfWeek: cell.dayOfWeek,
        hour: cell.hour,
        strength: cell.strength,
        source: "personnalise",
      });
    } else {
      await db
        .update(timeSlots)
        .set({ strength: cell.strength, source: "personnalise" })
        .where(eq(timeSlots.id, existing[0].id));
    }
  }
  revalidatePath("/parametres");
  revalidatePath("/bilan");
}
