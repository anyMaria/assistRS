import { db, viewConfigs } from "@/db";
import type { ViewConfig } from "@/db/schema";

/**
 * Filet de sécurité G10 : crée une vue Table par défaut si l'entité n'en a aucune.
 * Fichier séparé de view-config.ts (import `db`) — ne doit jamais être importé depuis
 * un composant client (ex. ViewToolbar), sous peine de faire fuiter le client DB
 * côté navigateur (URL_SCHEME_NOT_SUPPORTED sur "file:").
 */
// G15 : la vue par défaut des idées devient un kanban « Pipeline » (au lieu d'une
// table) sur une base vierge uniquement — si des vues existent déjà, on ne touche à rien.
const DEFAULTS: Record<"idees" | "publications", { name: string; type: string }> = {
  idees: { name: "Pipeline", type: "kanban" },
  publications: { name: "Table", type: "table" },
};

export async function ensureDefaultView(
  entity: "idees" | "publications",
  existing: ViewConfig[],
): Promise<ViewConfig[]> {
  if (existing.length > 0) return existing;
  const { name, type } = DEFAULTS[entity];
  const [created] = await db.insert(viewConfigs).values({ entity, name, type, config: "{}" }).returning();
  return [created];
}
