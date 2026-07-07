"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, accounts } from "@/db";

const accountSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  sector: z.string().default(""),
  tone: z.string().default(""),
  audience: z.string().default(""),
  platforms: z.array(z.string()).default([]),
  notes: z.string().default(""),
  validationDelayDays: z.coerce.number().int().min(0).max(60).default(3),
  color: z.string().default("#DE2F2C"),
  hourlyRate: z.coerce.number().min(0).optional(),
});

function parseAccountForm(formData: FormData) {
  const data = accountSchema.parse({
    name: formData.get("name"),
    sector: formData.get("sector") ?? "",
    tone: formData.get("tone") ?? "",
    audience: formData.get("audience") ?? "",
    platforms: formData.getAll("platforms").map(String),
    notes: formData.get("notes") ?? "",
    validationDelayDays: formData.get("validationDelayDays") ?? 3,
    color: formData.get("color") ?? "#DE2F2C",
    hourlyRate: formData.get("hourlyRateCents")?.toString() || undefined,
  });
  const { hourlyRate, ...rest } = data;
  return { ...rest, hourlyRateCents: hourlyRate !== undefined ? Math.round(hourlyRate * 100) : null };
}

export async function createAccount(formData: FormData) {
  const data = parseAccountForm(formData);
  await db.insert(accounts).values({ ...data, platforms: JSON.stringify(data.platforms) });
  revalidatePath("/comptes");
}

export async function updateAccount(id: number, formData: FormData) {
  const data = parseAccountForm(formData);
  await db
    .update(accounts)
    .set({ ...data, platforms: JSON.stringify(data.platforms) })
    .where(eq(accounts.id, id));
  revalidatePath("/comptes");
}

export async function deleteAccount(id: number) {
  await db.delete(accounts).where(eq(accounts.id, id));
  revalidatePath("/comptes");
}
