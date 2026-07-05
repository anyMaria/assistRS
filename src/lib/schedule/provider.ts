import { and, eq } from "drizzle-orm";
import { db, timeSlots, type TimeSlot } from "@/db";

/**
 * Abstraction « fournisseur d'horaires » — V1 : données en base (génériques Buffer,
 * modifiables). V2 : brancher l'API Buffer en ajoutant une implémentation, sans
 * toucher aux pages qui consomment getSlots().
 */
export interface ScheduleProvider {
  getSlots(platform: string, contentType: string): Promise<TimeSlot[]>;
}

class DbScheduleProvider implements ScheduleProvider {
  async getSlots(platform: string, contentType: string): Promise<TimeSlot[]> {
    return db
      .select()
      .from(timeSlots)
      .where(and(eq(timeSlots.platform, platform), eq(timeSlots.contentType, contentType)));
  }
}

export const scheduleProvider: ScheduleProvider = new DbScheduleProvider();
