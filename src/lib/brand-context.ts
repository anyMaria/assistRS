import { eq } from "drizzle-orm";
import { db, accounts } from "@/db";
import { platformLabel } from "@/lib/constants";

/**
 * Résumé compact de la marque, injecté dans tous les prompts IA.
 * Les espaces de marque complets (contexte/identité/éditorial/mémoire, CONCEPTION.md §3)
 * n'existent pas encore en base — cette version s'appuie sur la fiche compte actuelle
 * et sera enrichie quand ces tables seront ajoutées.
 */
export async function buildBrandContext(accountId: number): Promise<string> {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account) return "";

  const platforms: string[] = JSON.parse(account.platforms || "[]");
  const lignes = [
    `Marque : ${account.name}`,
    account.sector && `Secteur : ${account.sector}`,
    account.tone && `Ton éditorial : ${account.tone}`,
    account.audience && `Cible : ${account.audience}`,
    platforms.length && `Plateformes actives : ${platforms.map(platformLabel).join(", ")}`,
    account.notes && `Notes / contraintes : ${account.notes}`,
  ].filter(Boolean);

  return lignes.join("\n");
}
