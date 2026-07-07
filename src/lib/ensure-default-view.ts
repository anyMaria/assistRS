import { db, viewConfigs } from "@/db";
import type { ViewConfig } from "@/db/schema";

/**
 * Filet de sécurité G10 : crée une vue Table par défaut si l'entité n'en a aucune.
 * Fichier séparé de view-config.ts (import `db`) — ne doit jamais être importé depuis
 * un composant client (ex. ViewToolbar), sous peine de faire fuiter le client DB
 * côté navigateur (URL_SCHEME_NOT_SUPPORTED sur "file:").
 */
export async function ensureDefaultView(
  entity: "idees" | "publications",
  existing: ViewConfig[],
): Promise<ViewConfig[]> {
  if (existing.length > 0) return existing;
  const [created] = await db
    .insert(viewConfigs)
    .values({ entity, name: "Table", type: "table", config: "{}" })
    .returning();
  return [created];
}
