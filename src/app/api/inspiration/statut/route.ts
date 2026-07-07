import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, inspirationSearches, inspirationItems } from "@/db";
import { ACTORS, getApifyRunStatus, getApifyDatasetItems, normalizeItem, type ApifySource } from "@/lib/apify";
import { logUsage } from "@/lib/api-usage";

const FAILED_STATUSES = ["FAILED", "ABORTED", "TIMED-OUT", "TIMED_OUT"];

export async function GET(req: NextRequest) {
  const searchId = Number(req.nextUrl.searchParams.get("searchId"));
  if (!searchId) return NextResponse.json({ error: "searchId manquant" }, { status: 400 });

  const [search] = await db.select().from(inspirationSearches).where(eq(inspirationSearches.id, searchId));
  if (!search) return NextResponse.json({ error: "Recherche introuvable" }, { status: 404 });

  if (search.status !== "en_cours" || !search.apifyRunId) {
    return NextResponse.json({ status: search.status, errorMessage: search.errorMessage });
  }

  try {
    const runStatus = await getApifyRunStatus(search.apifyRunId);

    if (runStatus === "SUCCEEDED") {
      const rawItems = await getApifyDatasetItems(search.apifyDatasetId!, search.maxItems);
      const source = search.source as ApifySource;
      const normalized = rawItems.map((r) => normalizeItem(source, r)).filter((n) => n.imageUrl);

      if (normalized.length > 0) {
        await db.insert(inspirationItems).values(
          normalized.map((n) => ({
            searchId: search.id,
            source,
            imageUrl: n.imageUrl,
            author: n.author,
            postedAt: n.postedAt,
            metrics: JSON.stringify(n.metrics),
            originalUrl: n.originalUrl,
          })),
        );
        const cost = Math.ceil((normalized.length * ACTORS[source].centsPer1000) / 1000);
        await logUsage("apify", source, cost);
        await db
          .update(inspirationSearches)
          .set({ status: "termine", costCents: cost })
          .where(eq(inspirationSearches.id, search.id));
      } else {
        await db
          .update(inspirationSearches)
          .set({
            status: "termine",
            costCents: 0,
            errorMessage: "Aucun résultat — essaie des mots-clés plus simples ou en anglais.",
          })
          .where(eq(inspirationSearches.id, search.id));
      }
    } else if (FAILED_STATUSES.includes(runStatus)) {
      await db
        .update(inspirationSearches)
        .set({ status: "erreur", errorMessage: "La recherche d'inspiration a échoué. Réessaie dans quelques minutes." })
        .where(eq(inspirationSearches.id, search.id));
    } else {
      return NextResponse.json({ status: "en_cours" });
    }
  } catch (e) {
    console.error("[apify] polling échoué", e);
    await db
      .update(inspirationSearches)
      .set({ status: "erreur", errorMessage: "La recherche d'inspiration est indisponible. Réessaie dans quelques minutes." })
      .where(eq(inspirationSearches.id, search.id));
  }

  revalidatePath("/conception");
  const [updated] = await db.select().from(inspirationSearches).where(eq(inspirationSearches.id, search.id));
  return NextResponse.json({ status: updated.status, errorMessage: updated.errorMessage });
}
