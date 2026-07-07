import { NextRequest, NextResponse } from "next/server";
import { db, generations } from "@/db";
import { buildBrandContext } from "@/lib/brand-context";
import { generateJSON, PREAMBULE, Type } from "@/lib/gemini";

type IdeeGeneree = {
  titre: string;
  format: string;
  accroche: string;
  structure: string[];
  cta: string;
  pilier: string;
};

export async function POST(req: NextRequest) {
  const { accountId, theme, platform } = await req.json();
  if (!accountId || !theme) {
    return NextResponse.json({ ok: false, error: "Marque et thème requis." }, { status: 400 });
  }

  const brandContext = await buildBrandContext(Number(accountId));
  const userMessage = `Thème : ${theme}${platform ? `\nPlateforme visée : ${platform}` : ""}\n\nPropose 3 à 5 idées de publication.`;

  const result = await generateJSON<{ idees: IdeeGeneree[] }>({
    systemInstruction: `${PREAMBULE}\n\n${brandContext}`,
    contents: userMessage,
    responseSchema: {
      type: Type.OBJECT,
      required: ["idees"],
      properties: {
        idees: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["titre", "format", "accroche", "structure", "cta", "pilier"],
            properties: {
              titre: { type: Type.STRING },
              format: { type: Type.STRING, enum: ["carrousel", "reel", "story", "post"] },
              accroche: { type: Type.STRING },
              structure: { type: Type.ARRAY, items: { type: Type.STRING } },
              cta: { type: Type.STRING },
              pilier: { type: Type.STRING },
            },
          },
        },
      },
    },
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }

  await db.insert(generations).values({
    accountId: Number(accountId),
    kind: "idees",
    promptSummary: `Thème : ${theme}`,
    output: JSON.stringify(result.data.idees),
  });

  return NextResponse.json({ ok: true, idees: result.data.idees });
}
