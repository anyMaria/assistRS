import { eq } from "drizzle-orm";
import { db, accounts, brandProfiles, brandEditorial, brandMemoryRules } from "@/db";

function parseArray<T>(json: string | undefined | null, fallback: T): T {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Texte compact (< 600 mots) assemblant contexte marque + ligne éditoriale + mémoire
 * de corrections active — injecté dans systemInstruction de tous les appels IA de la marque.
 */
export async function buildBrandContext(accountId: number): Promise<string> {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  const [profile] = await db.select().from(brandProfiles).where(eq(brandProfiles.accountId, accountId));
  const [editorial] = await db.select().from(brandEditorial).where(eq(brandEditorial.accountId, accountId));
  const rules = await db
    .select()
    .from(brandMemoryRules)
    .where(eq(brandMemoryRules.accountId, accountId));
  const activeRules = rules.filter((r) => r.active);

  const lines: string[] = [];
  lines.push(`CONTEXTE DE MARQUE — ${account?.name ?? "marque"}`);
  if (account?.sector) lines.push(`Secteur : ${account.sector}`);
  if (profile?.description) lines.push(`Description : ${profile.description}`);
  if (profile?.offering) lines.push(`Offre : ${profile.offering}`);
  if (profile?.positioning) lines.push(`Positionnement : ${profile.positioning}`);
  if (profile?.personas) lines.push(`Cible : ${profile.personas}`);

  if (editorial?.mainMessage) lines.push(`Message principal : ${editorial.mainMessage}`);
  const secondary = parseArray<string[]>(editorial?.secondaryMessages, []);
  if (secondary.length) lines.push(`Messages secondaires : ${secondary.join(" · ")}`);

  const pillars = parseArray<{ name: string; sharePercent?: string }[]>(editorial?.pillars, []);
  if (pillars.length) {
    lines.push(
      `Piliers de contenu : ${pillars.map((p) => `${p.name}${p.sharePercent ? ` (${p.sharePercent} %)` : ""}`).join(", ")}`,
    );
  }

  if (editorial?.toneVoice) lines.push(`Ton de voix : ${editorial.toneVoice}`);
  const toneExamples = parseArray<{ onDit: string; onNeDitPas: string }[]>(editorial?.toneExamples, []);
  if (toneExamples.length) {
    lines.push(
      `Exemples de ton : ${toneExamples.map((t) => `on dit « ${t.onDit} » / on ne dit pas « ${t.onNeDitPas} »`).join(" ; ")}`,
    );
  }

  const dos = parseArray<string[]>(editorial?.dos, []);
  if (dos.length) lines.push(`À faire : ${dos.join(" ; ")}`);
  const donts = parseArray<string[]>(editorial?.donts, []);
  if (donts.length) lines.push(`À éviter : ${donts.join(" ; ")}`);

  const baseHashtags = parseArray<string[]>(editorial?.baseHashtags, []);
  if (baseHashtags.length) lines.push(`Hashtags de base : ${baseHashtags.join(" ")}`);
  const bannedHashtags = parseArray<string[]>(editorial?.bannedHashtags, []);
  if (bannedHashtags.length) lines.push(`Hashtags interdits : ${bannedHashtags.join(" ")}`);

  if (editorial?.emojiPolicy) {
    const label =
      editorial.emojiPolicy === "jamais"
        ? "jamais d'emoji"
        : editorial.emojiPolicy === "librement"
          ? "emojis libres"
          : "emojis avec parcimonie";
    lines.push(`Politique émojis : ${label}`);
  }

  const ctas = parseArray<string[]>(editorial?.ctas, []);
  if (ctas.length) lines.push(`CTA récurrents : ${ctas.join(" ; ")}`);
  if (editorial?.languages) lines.push(`Langue(s) : ${editorial.languages}`);
  if (editorial?.legalMentions) lines.push(`Mentions obligatoires : ${editorial.legalMentions}`);

  if (activeRules.length) {
    lines.push(
      `RÈGLES MÉMORISÉES (priment sur tout le reste) : ${activeRules.map((r) => `« ${r.rule} »`).join(" ; ")}`,
    );
  }

  let text = lines.join("\n");
  // Garde-fou : on plafonne à ~600 mots pour rester compact.
  const words = text.split(/\s+/);
  if (words.length > 600) {
    text = words.slice(0, 600).join(" ") + "…";
  }
  return text;
}
