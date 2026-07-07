import { db, productionSteps } from "@/db";
import { PRODUCTION_STEPS } from "@/lib/constants";

/** Crée les 5 étapes par défaut d'une publication (brief → maquette → … → programmé). */
export async function insertDefaultSteps(publicationId: number) {
  await db.insert(productionSteps).values(
    PRODUCTION_STEPS.map((s) => ({ publicationId, key: s.key, done: false })),
  );
}
