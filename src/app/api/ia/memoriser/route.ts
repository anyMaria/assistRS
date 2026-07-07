import { NextRequest, NextResponse } from "next/server";
import { generateJSON, PREAMBULE, Type } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { original, corrige } = await req.json();
  if (!original || !corrige) {
    return NextResponse.json({ ok: false, error: "Texte généré et texte corrigé requis." }, { status: 400 });
  }

  const userMessage = [
    "Voici un texte que tu as généré et la version corrigée par Ana.",
    "Déduis 1 à 3 règles d'écriture COURTES et RÉUTILISABLES (pas spécifiques à ce texte)",
    "qui expliquent ses corrections. Réponds en JSON : {\"regles\": [\"...\", \"...\"]}.",
    "Si les corrections sont purement factuelles (dates, noms), réponds {\"regles\": []}.",
    "",
    `Texte généré :\n${original}`,
    "",
    `Texte corrigé par Ana :\n${corrige}`,
  ].join("\n");

  const result = await generateJSON<{ regles: string[] }>({
    systemInstruction: PREAMBULE,
    contents: userMessage,
    responseSchema: {
      type: Type.OBJECT,
      required: ["regles"],
      properties: {
        regles: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }

  return NextResponse.json({ ok: true, regles: result.data.regles });
}
