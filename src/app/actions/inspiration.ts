"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db, inspirationSearches, inspirationItems, moodboards } from "@/db";
import {
  ACTORS,
  APIFY_SOURCES,
  startApifyRun,
  normalizeQuery,
  CACHE_DAYS,
  BUDGET_SOFT_LIMIT_CENTS,
  BUDGET_MONTHLY_CAP_CENTS,
  type ApifySource,
} from "@/lib/apify";
import { optimizeQuery } from "@/lib/inspiration-query";
import { monthlySpendCents } from "@/lib/api-usage";
import { isBlobConfigured } from "@/lib/blob";

const searchSchema = z.object({
  theme: z.string().min(1, "Le thème est requis"),
  accountId: z.coerce.number().int().positive().optional(),
  sources: z.array(z.enum(APIFY_SOURCES as [ApifySource, ...ApifySource[]])).min(1, "Choisis au moins une source"),
  periode: z.string().default("toutes"),
  tri: z.string().default("recent"),
  confirmer: z.coerce.boolean().default(false),
});

export type LancerRechercheResult =
  | { ok: true; searchIds: number[] }
  | { ok: false; error: string; requiresConfirmation?: boolean };

async function findCachedSearch(normalizedTheme: string, source: ApifySource) {
  const since = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(inspirationSearches)
    .where(
      and(
        eq(inspirationSearches.normalizedTheme, normalizedTheme),
        eq(inspirationSearches.source, source),
        eq(inspirationSearches.status, "termine"),
        gte(inspirationSearches.createdAt, since),
      ),
    )
    .orderBy(desc(inspirationSearches.createdAt))
    .limit(1);
  return rows[0];
}

export async function lancerRecherche(formData: FormData): Promise<LancerRechercheResult> {
  const parsed = searchSchema.safeParse({
    theme: formData.get("theme"),
    accountId: formData.get("accountId") || undefined,
    sources: formData.getAll("sources").map(String),
    periode: formData.get("periode") ?? "toutes",
    tri: formData.get("tri") ?? "recent",
    confirmer: formData.get("confirmer") === "1",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { theme, accountId, sources, periode, tri, confirmer } = parsed.data;
  const normalizedTheme = normalizeQuery(theme);
  const searchIds: number[] = [];

  for (const source of sources) {
    const cached = await findCachedSearch(normalizedTheme, source);
    if (cached) {
      searchIds.push(cached.id);
      continue;
    }

    const spend = await monthlySpendCents("apify");
    if (spend >= BUDGET_SOFT_LIMIT_CENTS && !confirmer) {
      return {
        ok: false,
        requiresConfirmation: true,
        error: `Budget Apify du mois presque atteint (${(spend / 100).toFixed(2)} $ / ${(BUDGET_MONTHLY_CAP_CENTS / 100).toFixed(2)} $). Lancer quand même ?`,
      };
    }

    const meta = ACTORS[source];
    const maxItems = Math.min(meta.maxItems, Math.max(meta.minItems, meta.maxItems));
    try {
      const optimizedQuery = await optimizeQuery(theme, source, accountId ?? null).catch(() => normalizeQuery(theme));
      const { runId, datasetId, queryUsed } = await startApifyRun(source, theme, maxItems, optimizedQuery);
      const [row] = await db
        .insert(inspirationSearches)
        .values({
          theme,
          normalizedTheme,
          accountId: accountId ?? null,
          source,
          periode,
          tri,
          maxItems,
          status: "en_cours",
          apifyRunId: runId,
          apifyDatasetId: datasetId,
          queryUsed,
        })
        .returning();
      searchIds.push(row.id);
    } catch (e) {
      console.error("[apify] démarrage échoué", e);
      const [row] = await db
        .insert(inspirationSearches)
        .values({
          theme,
          normalizedTheme,
          accountId: accountId ?? null,
          source,
          periode,
          tri,
          maxItems,
          status: "erreur",
          errorMessage: "La recherche d'inspiration est indisponible. Réessaie dans quelques minutes.",
        })
        .returning();
      searchIds.push(row.id);
    }
  }

  revalidatePath("/conception");
  return { ok: true, searchIds };
}

/** Relance une recherche en ignorant le cache (bouton « Relancer »). */
export async function relancerRecherche(searchId: number, confirmer = false): Promise<LancerRechercheResult> {
  const [existing] = await db.select().from(inspirationSearches).where(eq(inspirationSearches.id, searchId));
  if (!existing) return { ok: false, error: "Recherche introuvable." };

  const spend = await monthlySpendCents("apify");
  if (spend >= BUDGET_SOFT_LIMIT_CENTS && !confirmer) {
    return {
      ok: false,
      requiresConfirmation: true,
      error: `Budget Apify du mois presque atteint (${(spend / 100).toFixed(2)} $ / ${(BUDGET_MONTHLY_CAP_CENTS / 100).toFixed(2)} $). Lancer quand même ?`,
    };
  }

  try {
    const source = existing.source as ApifySource;
    const optimizedQuery = await optimizeQuery(existing.theme, source, existing.accountId).catch(() =>
      normalizeQuery(existing.theme),
    );
    const { runId, datasetId, queryUsed } = await startApifyRun(source, existing.theme, existing.maxItems, optimizedQuery);
    const [row] = await db
      .insert(inspirationSearches)
      .values({
        theme: existing.theme,
        normalizedTheme: existing.normalizedTheme,
        accountId: existing.accountId,
        source,
        periode: existing.periode,
        tri: existing.tri,
        maxItems: existing.maxItems,
        status: "en_cours",
        apifyRunId: runId,
        apifyDatasetId: datasetId,
        queryUsed,
      })
      .returning();
    revalidatePath("/conception");
    return { ok: true, searchIds: [row.id] };
  } catch (e) {
    console.error("[apify] relance échouée", e);
    return { ok: false, error: "La recherche d'inspiration est indisponible. Réessaie dans quelques minutes." };
  }
}

const moodboardSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  accountId: z.coerce.number().int().positive().optional(),
  theme: z.string().default(""),
});

export async function creerMoodboard(formData: FormData): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const parsed = moodboardSchema.safeParse({
    name: formData.get("name"),
    accountId: formData.get("accountId") || undefined,
    theme: formData.get("theme") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  const [row] = await db
    .insert(moodboards)
    .values({ name: parsed.data.name, accountId: parsed.data.accountId ?? null, theme: parsed.data.theme })
    .returning();
  revalidatePath("/conception");
  revalidatePath("/s-inspirer/moodboards");
  return { ok: true, id: row.id };
}

export async function epinglerItem(
  itemId: number,
  moodboardId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [item] = await db.select().from(inspirationItems).where(eq(inspirationItems.id, itemId));
  if (!item) return { ok: false, error: "Visuel introuvable." };

  // blobThumbUrl stocke le pathname du blob privé (servi via /api/blob/[...path], proxy authentifié).
  let blobThumbUrl: string | null = null;
  if (isBlobConfigured() && item.imageUrl) {
    try {
      const { put } = await import("@vercel/blob");
      const res = await fetch(item.imageUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const ext = item.imageUrl.split(".").pop()?.split("?")[0]?.slice(0, 4) || "jpg";
        const blob = await put(`moodboards/${moodboardId}/${item.id}.${ext}`, Buffer.from(buffer), {
          access: "private",
          addRandomSuffix: true,
        });
        blobThumbUrl = blob.pathname;
      }
    } catch (e) {
      console.error("[blob] copie de l'image échouée", e);
      // Échec propre : on épingle quand même avec l'URL d'origine (qui peut expirer).
    }
  }

  await db
    .update(inspirationItems)
    .set({ pinnedBoardId: moodboardId, ...(blobThumbUrl ? { blobThumbUrl } : {}) })
    .where(eq(inspirationItems.id, itemId));
  revalidatePath("/conception");
  revalidatePath("/s-inspirer/moodboards");
  return { ok: true };
}

export async function retirerDuMoodboard(itemId: number) {
  await db.update(inspirationItems).set({ pinnedBoardId: null }).where(eq(inspirationItems.id, itemId));
  revalidatePath("/s-inspirer/moodboards");
}
