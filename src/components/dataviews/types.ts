// Forme commune des éléments affichés par les vues (table / kanban / calendrier)
export type DataBadge = { label: string; color?: string };

export type DataCard = {
  id: number;
  title: string;
  subtitle?: string;
  badges: DataBadge[];
  /** Couleur conditionnelle évaluée (règles /parametres), ou null */
  color: string | null;
  /** Clé de colonne pour le kanban (ex. statut) */
  column: string;
  /** Libellé humain de `column` (ex. « En production »), affiché dans la vue table. */
  columnLabel?: string;
  /** Date pour le calendrier */
  date: Date | null;
  /** Ligne d'info supplémentaire (ex. deadline visuel) */
  extra?: string;
  /** Couleur du texte extra */
  extraColor?: string;
  /** Contenu long affiché au dépliage (structure d'idée…) */
  body?: string;
  /** Valeurs déjà formatées pour affichage, par champ (RULE_FIELDS) — utilisé par le calendrier configurable. */
  properties?: Record<string, string>;
  /** Aperçu du visuel final, pour la vue Galerie. */
  visualUrl?: string;
  /** Liste complète et ordonnée de champs affichés dans la fenêtre de détail (façon Notion). */
  detail?: { label: string; value: string }[];
};

export type KanbanColumn = { key: string; label: string };
