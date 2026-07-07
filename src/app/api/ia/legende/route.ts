import { NextRequest, NextResponse } from "next/server";
import { db, generations } from "@/db";
import { buildBrandContext } from "@/lib/brand-context";
import { generateText, PREAMBULE } from "@/lib/gemini";
import { platformLabel, formatLabel } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { accountId, platform, format, brief, ideaId, publicationId } = await req.json();
  if (!accountId || !platform) {
    return NextResponse.json({ ok: false, error: "Marque et plateforme requises." }, { status: 400 });
  }

  const brandContext = await buildBrandContext(Number(accountId));
  const userMessage = [
    `Rédige la légende d'une publication ${platformLabel(platform)} au format ${formatLabel(format ?? "post")}.`,
    brief ? `Brief : ${brief}` : "",
    "Rends UNIQUEMENT la légende (avec hashtags si pertinent pour la marque), sans commentaire ni titre.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateText({
    systemInstruction: `${PREAMBULE}\n\n${brandContext}`,
    contents: userMessage,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }

  const [generation] = await db
    .insert(generations)
    .values({
      accountId: Number(accountId),
      publicationId: publicationId ? Number(publicationId) : null,
      ideaId: ideaId ? Number(ideaId) : null,
      kind: "legende",
      promptSummary: brief ? String(brief).slice(0, 200) : "",
      output: result.data,
    })
    .returning();

  return NextResponse.json({ ok: true, texte: result.data, generationId: generation.id });
}
