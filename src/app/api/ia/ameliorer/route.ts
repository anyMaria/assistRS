import { NextRequest, NextResponse } from "next/server";
import { db, generations } from "@/db";
import { buildBrandContext } from "@/lib/brand-context";
import { generateText, PREAMBULE } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { accountId, texte } = await req.json();
  if (!accountId || !texte) {
    return NextResponse.json({ ok: false, error: "Marque et texte requis." }, { status: 400 });
  }

  const brandContext = await buildBrandContext(Number(accountId));
  const userMessage = [
    "Améliore le texte suivant sans le dénaturer : garde les idées, le vocabulaire de la marque",
    "et la longueur (±20 %). Corrige orthographe et rythme.",
    "Rends UNIQUEMENT le texte amélioré, sans commentaire.",
    "",
    `Texte :\n${texte}`,
  ].join("\n");

  const result = await generateText({
    systemInstruction: `${PREAMBULE}\n\n${brandContext}`,
    contents: userMessage,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }

  await db.insert(generations).values({
    accountId: Number(accountId),
    kind: "amelioration",
    promptSummary: String(texte).slice(0, 200),
    output: result.data,
  });

  return NextResponse.json({ ok: true, texte: result.data });
}
