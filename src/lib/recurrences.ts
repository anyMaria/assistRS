import { eq } from "drizzle-orm";
import { db, recurrences, publications } from "@/db";
import type { Recurrence } from "@/db/schema";
import { insertDefaultSteps } from "@/lib/production-steps";

const DAY_MS = 24 * 60 * 60 * 1000;
const HORIZON_DAYS = 35;

/** Dates d'occurrence entre `from` (exclu) et `until` (inclus), à l'heure du créneau. */
function computeDates(rec: Recurrence, from: Date, until: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(rec.hour, 0, 0, 0);

  // rec.dayOfWeek : 0 = lundi … 6 = dimanche ; Date#getDay() : 0 = dimanche … 6 = samedi.
  const jsTargetDay = (rec.dayOfWeek + 1) % 7;
  while (cursor.getDay() !== jsTargetDay) cursor.setDate(cursor.getDate() + 1);
  if (cursor.getTime() <= from.getTime()) cursor.setDate(cursor.getDate() + 7);

  const monthsSeen = new Set<string>();
  while (cursor.getTime() <= until.getTime()) {
    if (rec.freq === "mensuel") {
      const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      if (!monthsSeen.has(monthKey)) {
        dates.push(new Date(cursor));
        monthsSeen.add(monthKey);
      }
    } else {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

/**
 * Génère les occurrences manquantes de chaque récurrence active, jusqu'à J+35.
 * Idempotent : `lastGeneratedUntil` empêche de recréer deux fois la même occurrence.
 */
export async function generateOccurrences(now: Date = new Date()): Promise<number> {
  const horizon = new Date(now.getTime() + HORIZON_DAYS * DAY_MS);
  const active = await db.select().from(recurrences).where(eq(recurrences.active, true));
  let created = 0;

  for (const rec of active) {
    const startFrom = rec.lastGeneratedUntil && rec.lastGeneratedUntil > now ? rec.lastGeneratedUntil : now;
    const dates = computeDates(rec, startFrom, horizon);
    if (dates.length > 0) {
      const rows = await db
        .insert(publications)
        .values(
          dates.map((d) => ({
            accountId: rec.accountId,
            platform: rec.platform,
            format: rec.format,
            title: rec.titlePattern,
            status: "planifiee" as const,
            plannedAt: d,
          })),
        )
        .returning();
      for (const row of rows) await insertDefaultSteps(row.id);
      created += rows.length;
    }
    await db.update(recurrences).set({ lastGeneratedUntil: horizon }).where(eq(recurrences.id, rec.id));
  }
  return created;
}
