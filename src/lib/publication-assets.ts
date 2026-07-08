// Helpers partagés pour les visuels transitoires d'une publication (G14) — utilisés par
// la route d'upload (onUploadCompleted, prod) et par le repli client (dev, cf. doc Vercel
// Blob client uploads : onUploadCompleted n'est pas rappelable en local).
import { desc, eq } from "drizzle-orm";
import { db, publicationAssets } from "@/db";

/** Idempotent par pathname — évite un doublon si le webhook prod ET le repli dev insèrent. */
export async function insertAssetIfMissing(
  publicationId: number,
  url: string,
  pathname: string,
  sizeBytes = 0,
) {
  const existing = await db.select().from(publicationAssets).where(eq(publicationAssets.pathname, pathname));
  if (existing.length > 0) return existing[0];

  const [last] = await db
    .select()
    .from(publicationAssets)
    .where(eq(publicationAssets.publicationId, publicationId))
    .orderBy(desc(publicationAssets.position))
    .limit(1);
  const position = last ? last.position + 1 : 0;

  const [row] = await db
    .insert(publicationAssets)
    .values({ publicationId, url, pathname, position, sizeBytes })
    .returning();
  return row;
}
