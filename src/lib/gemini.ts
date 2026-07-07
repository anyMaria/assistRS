// Client Gemini unique — GUIDELINE.md §5. Palier gratuit (~1 500 req/jour, gemini-2.5-flash).
import { GoogleGenAI, Type } from "@google/genai";

export const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export { Type };

/** null si GEMINI_API_KEY absente — permet l'échec propre sans planter au chargement du module. */
function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export const PREAMBULE = `Tu es l'assistant éditorial d'Ana, community manager freelance. Tu écris en français.

Règles d'écriture strictes (anti-slop) :
- Interdits : "N'hésitez pas", "Plongez dans", "Découvrez sans plus attendre",
  "Que vous soyez… ou…", "Alors, prêt à… ?", les questions rhétoriques creuses,
  plus d'un point d'exclamation par texte, les émojis en série (max 2 par texte,
  0 si la politique de la marque l'exige), le jargon marketing vide.
- Exigences : concret et spécifique à la marque (utilise ses vrais produits, lieux,
  personnes), phrases courtes, une seule idée par phrase, accroche qui donne une
  information ou une émotion réelle, CTA simple et unique.
- Respecte scrupuleusement le CONTEXTE DE MARQUE fourni, en particulier le ton,
  les do's/don'ts et les RÈGLES MÉMORISÉES (elles priment sur tout le reste).`;

export type GeminiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("429")) {
    return "L'IA gratuite est très sollicitée, réessaie dans une minute.";
  }
  return "L'IA est indisponible pour l'instant. Réessaie dans quelques minutes.";
}

/** Sortie structurée (idées, calendrier, règles) — jamais mélangée avec du texte libre dans le même appel. */
export async function generateJSON<T>(params: {
  systemInstruction: string;
  contents: string;
  responseSchema: object;
}): Promise<GeminiResult<T>> {
  const ai = getClient();
  if (!ai) {
    return { ok: false, error: "L'IA n'est pas configurée (GEMINI_API_KEY manquante)." };
  }
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: params.responseSchema,
      },
    });
    const data = JSON.parse(response.text ?? "{}") as T;
    return { ok: true, data };
  } catch (e) {
    console.error("[gemini] génération JSON échouée", e);
    return { ok: false, error: friendlyError(e) };
  }
}

/** Sortie texte libre (légende, amélioration, analyse). */
export async function generateText(params: {
  systemInstruction: string;
  contents: string;
}): Promise<GeminiResult<string>> {
  const ai = getClient();
  if (!ai) {
    return { ok: false, error: "L'IA n'est pas configurée (GEMINI_API_KEY manquante)." };
  }
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
      },
    });
    const text = (response.text ?? "").trim();
    return { ok: true, data: text };
  } catch (e) {
    console.error("[gemini] génération texte échouée", e);
    return { ok: false, error: friendlyError(e) };
  }
}
