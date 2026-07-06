import { matchesCondition, type Condition, type RuleRow } from "@/lib/color-rules";

/** Réglages d'une vue sauvegardée (view_configs.config, JSON libre). */
export type ViewSettings = {
  /** Kanban : champ de regroupement en colonnes. */
  groupBy?: string;
  /** Calendrier : propriétés affichées sur chaque carreau (RULE_FIELDS[entity]). */
  displayProps?: string[];
  /** Table/Kanban/Calendrier : tri appliqué avant affichage. */
  sortBy?: string;
  sortDir?: "asc" | "desc";
  /** Filtres combinés en ET. */
  filters?: Condition[];
};

export function parseViewSettings(raw: string | null | undefined): ViewSettings {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Filtre et trie en parallèle une liste d'éléments et leurs lignes de correspondance
 * (mêmes index). `rows[i]` doit correspondre à `items[i]`.
 */
export function applyViewSettings<T>(
  items: T[],
  rows: RuleRow[],
  settings: ViewSettings,
): { items: T[]; rows: RuleRow[] } {
  let indices = items.map((_, i) => i);

  if (settings.filters?.length) {
    indices = indices.filter((i) => settings.filters!.every((f) => matchesCondition(f, rows[i])));
  }

  if (settings.sortBy) {
    const dir = settings.sortDir === "desc" ? -1 : 1;
    const field = settings.sortBy;
    indices = [...indices].sort((a, b) => {
      const va = rows[a][field];
      const vb = rows[b][field];
      const na = Number(va);
      const nb = Number(vb);
      const bothNumeric = va !== "" && vb !== "" && va != null && vb != null && !Number.isNaN(na) && !Number.isNaN(nb);
      if (bothNumeric) return (na - nb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
  }

  return { items: indices.map((i) => items[i]), rows: indices.map((i) => rows[i]) };
}
