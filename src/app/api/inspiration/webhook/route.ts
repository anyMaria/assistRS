import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, inspirationSearches } from "@/db";
import { ingestSearch } from "@/lib/inspiration-ingest";

/**
 * Webhook Apify ad hoc (attaché au démarrage du run par startApifyRun) — ingère les
 * résultats côté serveur même si la page S'inspirer a été fermée pendant le run (G13).
 * Sécurité : ?secret=CRON_SECRET (réutilise la variable existante). Toujours 200 même
 * si déjà traité : ingestSearch est idempotent, et Apify retenterait sinon.
 */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // rien à traiter, mais pas d'échec
  }

  // Format constaté : { resource: { id: "<runId>" }, eventType, ... } — voir doc Apify webhooks.
  const resource = (payload.resource ?? {}) as Record<string, unknown>;
  const runId = typeof resource.id === "string" ? resource.id : undefined;
  if (!runId) return NextResponse.json({ ok: true });

  const [search] = await db.select().from(inspirationSearches).where(eq(inspirationSearches.apifyRunId, runId));
  if (!search) return NextResponse.json({ ok: true });

  await ingestSearch(search.id);
  revalidatePath("/conception");
  return NextResponse.json({ ok: true });
}
