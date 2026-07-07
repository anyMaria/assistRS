import { scheduleProvider } from "@/lib/schedule/provider";
import { PLATFORMS } from "@/lib/constants";

export type SuggestedSlot = { dayOfWeek: number; hour: number; platform: string };

/**
 * Créneaux forts (strength 3) toutes plateformes confondues, pour l'overlay « Horaires
 * conseillés » du planning (G10). Lit `time_slots` — la même table que la grille de
 * Paramètres et que la synchro Buffer (G11) : évolue automatiquement avec l'audience réelle.
 */
export async function getSuggestedSlots(): Promise<SuggestedSlot[]> {
  const perPlatform = await Promise.all(PLATFORMS.map((p) => scheduleProvider.getSlots(p.value, "post")));
  const out: SuggestedSlot[] = [];
  perPlatform.forEach((slots, i) => {
    for (const s of slots) {
      if (s.strength === 3) out.push({ dayOfWeek: s.dayOfWeek, hour: s.hour, platform: PLATFORMS[i].value });
    }
  });
  return out;
}
