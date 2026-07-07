import { eq } from "drizzle-orm";
import { db, timeSlots } from "@/db";

export type CandidateSlot = {
  index: number;
  date: string; // YYYY-MM-DD
  jour: string; // libellé FR du jour
  heure: number;
  plateforme: string;
};

const DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Créneaux forts (strength 3) disponibles sur le mois pour les plateformes de la marque —
 * un candidat par jour et par plateforme au maximum (règle « jamais plus d'une
 * publication/jour/plateforme », CONCEPTION.md §5.3). Sert de base au choix de l'IA pour
 * le calendrier éditorial du rituel mensuel : les dates réelles sont calculées ici,
 * l'IA se contente de choisir parmi cette liste.
 */
export async function buildCandidateSlots(month: string, platforms: string[]): Promise<CandidateSlot[]> {
  if (platforms.length === 0) return [];
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  const strongSlots = await db.select().from(timeSlots).where(eq(timeSlots.strength, 3));
  const bestHourByPlatformDay = new Map<string, number>();
  for (const s of strongSlots) {
    if (!platforms.includes(s.platform)) continue;
    const key = `${s.platform}-${s.dayOfWeek}`;
    if (!bestHourByPlatformDay.has(key)) bestHourByPlatformDay.set(key, s.hour);
  }

  const candidates: CandidateSlot[] = [];
  let index = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const jsDay = new Date(year, mon - 1, day).getDay(); // 0 = dimanche
    const dayOfWeek = (jsDay + 6) % 7; // 0 = lundi, cohérent avec time_slots
    for (const platform of platforms) {
      const heure = bestHourByPlatformDay.get(`${platform}-${dayOfWeek}`);
      if (heure === undefined) continue;
      candidates.push({
        index: index++,
        date: `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        jour: DAYS_FR[dayOfWeek],
        heure,
        plateforme: platform,
      });
    }
  }
  return candidates;
}
