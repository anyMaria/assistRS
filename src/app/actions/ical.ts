"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, isNull } from "drizzle-orm";
import { db, icalTokens } from "@/db";

/** Génère un nouveau token et révoque l'ancien — une seule URL d'abonnement valide à la fois. */
export async function genererTokenIcal() {
  await db.update(icalTokens).set({ revokedAt: new Date() }).where(isNull(icalTokens.revokedAt));
  const token = randomBytes(24).toString("hex");
  await db.insert(icalTokens).values({ token });
  revalidatePath("/parametres");
}

export async function revoquerTokenIcal(id: number) {
  await db.update(icalTokens).set({ revokedAt: new Date() }).where(eq(icalTokens.id, id));
  revalidatePath("/parametres");
}
