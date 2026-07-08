"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  accounts,
  brandProfiles,
  brandIdentity,
  brandEditorial,
  brandMemoryRules,
  brandAssets,
  brandClientNotes,
} from "@/db";

function jsonArray(formData: FormData, key: string): unknown[] {
  const raw = formData.get(key)?.toString() || "[]";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function revalidateBrand(accountId: number) {
  revalidatePath(`/marques/${accountId}`);
}

// ——— Onglet Contexte d'entreprise (fiche compte + brand_profiles, un seul « Enregistrer ») ———

const accountBaseSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  sector: z.string().default(""),
  platforms: z.array(z.string()).default([]),
  validationDelayDays: z.coerce.number().int().min(0).max(60).default(3),
  color: z.string().default("#F5352B"),
});

const profileSchema = z.object({
  size: z.string().default(""),
  location: z.string().default(""),
  description: z.string().default(""),
  offering: z.string().default(""),
  positioning: z.string().default(""),
  personas: z.string().default(""),
});

export async function updateBrandContext(accountId: number, formData: FormData) {
  const account = accountBaseSchema.parse({
    name: formData.get("name"),
    sector: formData.get("sector") ?? "",
    platforms: formData.getAll("platforms").map(String),
    validationDelayDays: formData.get("validationDelayDays") ?? 3,
    color: formData.get("color") ?? "#F5352B",
  });
  await db
    .update(accounts)
    .set({
      name: account.name,
      sector: account.sector,
      platforms: JSON.stringify(account.platforms),
      validationDelayDays: account.validationDelayDays,
      color: account.color,
    })
    .where(eq(accounts.id, accountId));

  const data = profileSchema.parse({
    size: formData.get("size") ?? "",
    location: formData.get("location") ?? "",
    description: formData.get("description") ?? "",
    offering: formData.get("offering") ?? "",
    positioning: formData.get("positioning") ?? "",
    personas: formData.get("personas") ?? "",
  });
  const values = {
    accountId,
    ...data,
    keyPeople: JSON.stringify(jsonArray(formData, "keyPeople")),
    competitors: JSON.stringify(jsonArray(formData, "competitors")),
    seasonality: JSON.stringify(jsonArray(formData, "seasonality")),
    links: JSON.stringify(jsonArray(formData, "links")),
  };
  await db
    .insert(brandProfiles)
    .values(values)
    .onConflictDoUpdate({ target: brandProfiles.accountId, set: values });
  revalidateBrand(accountId);
  revalidatePath("/marques");
}

// ——— Onglet Identité visuelle ———

const identitySchema = z.object({
  imageStyle: z.string().default(""),
  usageRules: z.string().default(""),
});

export async function updateBrandIdentity(accountId: number, formData: FormData) {
  const data = identitySchema.parse({
    imageStyle: formData.get("imageStyle") ?? "",
    usageRules: formData.get("usageRules") ?? "",
  });
  const values = {
    accountId,
    ...data,
    palette: JSON.stringify(jsonArray(formData, "palette")),
    fonts: JSON.stringify(jsonArray(formData, "fonts")),
  };
  await db
    .insert(brandIdentity)
    .values(values)
    .onConflictDoUpdate({ target: brandIdentity.accountId, set: values });
  revalidateBrand(accountId);
}

// ——— Onglet Ligne éditoriale ———

const editorialSchema = z.object({
  mainMessage: z.string().default(""),
  toneVoice: z.string().default(""),
  emojiPolicy: z.enum(["jamais", "parcimonie", "librement"]).default("parcimonie"),
  languages: z.string().default("fr"),
  legalMentions: z.string().default(""),
});

export async function updateBrandEditorial(accountId: number, formData: FormData) {
  const data = editorialSchema.parse({
    mainMessage: formData.get("mainMessage") ?? "",
    toneVoice: formData.get("toneVoice") ?? "",
    emojiPolicy: formData.get("emojiPolicy") ?? "parcimonie",
    languages: formData.get("languages") ?? "fr",
    legalMentions: formData.get("legalMentions") ?? "",
  });
  const values = {
    accountId,
    ...data,
    secondaryMessages: JSON.stringify(jsonArray(formData, "secondaryMessages")),
    pillars: JSON.stringify(jsonArray(formData, "pillars")),
    toneExamples: JSON.stringify(jsonArray(formData, "toneExamples")),
    dos: JSON.stringify(jsonArray(formData, "dos")),
    donts: JSON.stringify(jsonArray(formData, "donts")),
    baseHashtags: JSON.stringify(jsonArray(formData, "baseHashtags")),
    bannedHashtags: JSON.stringify(jsonArray(formData, "bannedHashtags")),
    ctas: JSON.stringify(jsonArray(formData, "ctas")),
  };
  await db
    .insert(brandEditorial)
    .values(values)
    .onConflictDoUpdate({ target: brandEditorial.accountId, set: values });
  revalidateBrand(accountId);
}

// ——— Onglet Mémoire de corrections ———

export async function addMemoryRule(accountId: number, formData: FormData) {
  const rule = formData.get("rule")?.toString().trim();
  if (!rule) return;
  await db.insert(brandMemoryRules).values({
    accountId,
    rule,
    origin: formData.get("origin")?.toString() || "ajout manuel",
  });
  revalidateBrand(accountId);
}

export async function toggleMemoryRule(accountId: number, id: number, active: boolean) {
  await db.update(brandMemoryRules).set({ active }).where(eq(brandMemoryRules.id, id));
  revalidateBrand(accountId);
}

export async function deleteMemoryRule(accountId: number, id: number) {
  await db.delete(brandMemoryRules).where(eq(brandMemoryRules.id, id));
  revalidateBrand(accountId);
}

// ——— Onglet Retours client (verbatim archivé, distinct de la mémoire de corrections) ———

export async function addClientNote(accountId: number, formData: FormData) {
  const content = formData.get("content")?.toString().trim();
  if (!content) return;
  const publicationIdRaw = formData.get("publicationId")?.toString();
  await db.insert(brandClientNotes).values({
    accountId,
    content,
    publicationId: publicationIdRaw ? Number(publicationIdRaw) : null,
  });
  revalidateBrand(accountId);
  revalidatePath("/planning");
}

/** Même action, appelable depuis le détail d'une publication (planning) : accountId déduit côté appelant. */
export async function addClientNoteForPublication(accountId: number, publicationId: number, formData: FormData) {
  const content = formData.get("content")?.toString().trim();
  if (!content) return;
  await db.insert(brandClientNotes).values({ accountId, publicationId, content });
  revalidateBrand(accountId);
  revalidatePath("/planning");
}

export async function deleteClientNote(accountId: number, id: number) {
  await db.delete(brandClientNotes).where(eq(brandClientNotes.id, id));
  revalidateBrand(accountId);
  revalidatePath("/planning");
}

// ——— Assets ———

export async function deleteBrandAsset(accountId: number, formData: FormData) {
  const id = Number(formData.get("id"));
  await db.delete(brandAssets).where(eq(brandAssets.id, id));
  revalidateBrand(accountId);
}
