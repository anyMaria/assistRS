import { NextRequest, NextResponse } from "next/server";
import { like, or } from "drizzle-orm";
import { db, accounts, ideas, publications, moodboards, contentTemplates } from "@/db";

export type SearchResult = {
  type: "marque" | "idee" | "publication" | "moodboard" | "modele";
  id: number;
  label: string;
  meta?: string;
  href: string;
};

const LIMIT = 6;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }
  const needle = `%${q}%`;

  try {
    const [matchAccounts, matchIdeas, matchPublications, matchMoodboards, matchTemplates] =
      await Promise.all([
        db.select().from(accounts).where(like(accounts.name, needle)).limit(LIMIT),
        db
          .select()
          .from(ideas)
          .where(or(like(ideas.title, needle), like(ideas.theme, needle)))
          .limit(LIMIT),
        db.select().from(publications).where(like(publications.title, needle)).limit(LIMIT),
        db.select().from(moodboards).where(like(moodboards.name, needle)).limit(LIMIT),
        db.select().from(contentTemplates).where(like(contentTemplates.title, needle)).limit(LIMIT),
      ]);

    const results: SearchResult[] = [
      ...matchAccounts.map((a) => ({
        type: "marque" as const,
        id: a.id,
        label: a.name,
        meta: a.sector || undefined,
        href: `/marques/${a.id}`,
      })),
      ...matchIdeas.map((i) => ({
        type: "idee" as const,
        id: i.id,
        label: i.title,
        meta: i.theme || undefined,
        href: `/idees`,
      })),
      ...matchPublications.map((p) => ({
        type: "publication" as const,
        id: p.id,
        label: p.title || "(sans titre)",
        meta: p.platform,
        href: `/planning`,
      })),
      ...matchMoodboards.map((m) => ({
        type: "moodboard" as const,
        id: m.id,
        label: m.name,
        meta: m.theme || undefined,
        href: `/s-inspirer/moodboards`,
      })),
      ...matchTemplates.map((t) => ({
        type: "modele" as const,
        id: t.id,
        label: t.title,
        meta: t.format,
        href: `/creation`,
      })),
    ];

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("[recherche] échec de la requête", e);
    return NextResponse.json({ ok: false, error: "La recherche est indisponible." }, { status: 200 });
  }
}
