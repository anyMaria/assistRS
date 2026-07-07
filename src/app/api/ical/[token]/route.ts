import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, icalTokens, publications, accounts } from "@/db";
import { computeVisualDeadline } from "@/lib/deadline";
import { buildIcs, type IcsEvent } from "@/lib/ical";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [row] = await db
    .select()
    .from(icalTokens)
    .where(and(eq(icalTokens.token, token), isNull(icalTokens.revokedAt)));
  if (!row) {
    return NextResponse.json({ error: "Lien iCal invalide ou révoqué" }, { status: 404 });
  }

  const allAccounts = await db.select().from(accounts);
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));
  const pubs = await db.select().from(publications).where(eq(publications.status, "planifiee"));

  const events: IcsEvent[] = [];
  for (const pub of pubs) {
    if (!pub.plannedAt) continue;
    const account = accountById.get(pub.accountId);
    const label = pub.title || "sans titre";
    const brand = account?.name ?? "";
    const deadline = computeVisualDeadline(pub.plannedAt, account?.validationDelayDays ?? 3);
    events.push({ uid: `pub-${pub.id}-deadline`, date: deadline, summary: `🎨 Visuel à créer : ${label} (${brand})` });
    events.push({ uid: `pub-${pub.id}-publication`, date: pub.plannedAt, summary: `📣 Publication : ${label} (${brand})` });
  }

  return new NextResponse(buildIcs(events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=assistrs.ics",
    },
  });
}
