// Client IA unique — Google Gemini, palier gratuit (GUIDELINE.md §5).
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

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

export class GeminiError extends Error {}

/** Erreur 429 (quota/minute) → message dédié, pas de retry automatique en boucle. */
export function geminiErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("429")) {
    return "L'IA gratuite est très sollicitée, réessaie dans une minute.";
  }
  return "L'IA est indisponible pour le moment. Réessaie dans quelques minutes.";
}
