import { and, eq, gte } from "drizzle-orm";
import { db, apiUsage } from "@/db";

/** Enregistre le coût (en centimes) d'un appel externe — obligatoire pour Apify, Gemini, Resend. */
export async function logUsage(service: string, action: string, costCents: number) {
  await db.insert(apiUsage).values({ service, action, costCents });
}

/** Dépense cumulée du mois en cours pour un service, en centimes. */
export async function monthlySpendCents(service: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = await db
    .select()
    .from(apiUsage)
    .where(and(eq(apiUsage.service, service), gte(apiUsage.createdAt, startOfMonth)));
  return rows.reduce((sum, r) => sum + r.costCents, 0);
}
