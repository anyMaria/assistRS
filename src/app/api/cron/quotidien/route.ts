import { NextResponse } from "next/server";
import { generateOccurrences } from "@/lib/recurrences";
import { buildBilanData, renderBilanHtml } from "@/lib/bilan";
import { sendEmail, emailShell } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Cron quotidien unique (limite Vercel Hobby : 1 cron fiable/jour, GUIDELINE.md §4 G6).
 * Décide selon la date : lundi → bilan hebdo ; 1er du mois → invitation au rituel ;
 * tous les jours → génération des occurrences de récurrences.
 * `?simuler=lundi|premier` force le branchement pour tester sans attendre la vraie date.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const simuler = url.searchParams.get("simuler");
  const now = new Date();
  const isMonday = simuler === "lundi" || now.getDay() === 1;
  const isFirstOfMonth = simuler === "premier" || now.getDate() === 1;

  const result: Record<string, unknown> = {};

  try {
    result.occurrencesCreees = await generateOccurrences(now);
  } catch (e) {
    console.error("[cron] génération des récurrences échouée", e);
    result.occurrencesCreees = 0;
  }

  if (isMonday) {
    const data = await buildBilanData(now);
    const html = emailShell("Ton bilan de la semaine", renderBilanHtml(data));
    const sent = await sendEmail("Ton bilan de la semaine — Assist RS", html, "bilan-hebdo");
    result.bilanEnvoye = sent.ok;
  }

  if (isFirstOfMonth) {
    const html = emailShell(
      "C'est l'heure du rituel mensuel",
      `<p>15 minutes pour préparer le calendrier éditorial du mois — ouvre l'app et rends-toi sur
      <strong>/bilan?onglet=rituel</strong> pour chaque marque à préparer.</p>`,
    );
    const sent = await sendEmail("15 min pour préparer ton mois — Assist RS", html, "rituel-invitation");
    result.invitationRituelEnvoyee = sent.ok;
  }

  return NextResponse.json({ ok: true, ...result });
}
