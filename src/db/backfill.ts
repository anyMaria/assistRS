/**
 * Backfill : crée les 5 étapes de production par défaut pour les publications
 * existantes qui n'en ont pas encore (créées avant le bloc G4).
 * Lancement : npm run db:backfill (idempotent — ignore les publications déjà complètes).
 */
import { eq } from "drizzle-orm";
import { db, publications, productionSteps } from "./index";
import { PRODUCTION_STEPS } from "../lib/constants";

async function main() {
  const pubs = await db.select().from(publications);
  let created = 0;
  for (const pub of pubs) {
    const existing = await db
      .select()
      .from(productionSteps)
      .where(eq(productionSteps.publicationId, pub.id));
    if (existing.length > 0) continue;
    await db.insert(productionSteps).values(
      PRODUCTION_STEPS.map((s) => ({ publicationId: pub.id, key: s.key, done: false })),
    );
    created++;
  }
  console.log(`Backfill terminé : ${created} publication(s) complétée(s) avec leurs étapes de production.`);
}

main();
