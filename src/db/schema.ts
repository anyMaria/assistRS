import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Un compte géré : ma marque, un client, une collectivité…
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sector: text("sector").default(""),
  tone: text("tone").default(""),
  audience: text("audience").default(""),
  // JSON array de plateformes actives : ["instagram","facebook","linkedin"]
  platforms: text("platforms").notNull().default("[]"),
  notes: text("notes").default(""),
  // Délai approximatif (en jours) de validation par le client
  validationDelayDays: integer("validation_delay_days").notNull().default(3),
  color: text("color").notNull().default("#DE2F2C"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Modèle de contenu : format éprouvé, de la bibliothèque ou personnalisé
export const contentTemplates = sqliteTable("content_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  format: text("format").notNull(), // carrousel | reel | story | post
  platforms: text("platforms").notNull().default("[]"), // JSON array
  objective: text("objective").notNull(), // notoriete | engagement | conversion
  hook: text("hook").default(""), // accroche type
  structure: text("structure").notNull(), // plan slide par slide / séquences
  cta: text("cta").default(""), // appel à l'action suggéré
  origin: text("origin").notNull().default("personnalise"), // bibliotheque | personnalise
});

// Idée de publication, générée par IA ou saisie à la main
export const ideas = sqliteTable("ideas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  theme: text("theme").notNull(),
  title: text("title").notNull(),
  format: text("format").default("post"),
  platform: text("platform").default(""),
  content: text("content").notNull(), // structure détaillée (texte)
  status: text("status").notNull().default("idee"), // idee | en_production | publiee
  source: text("source").notNull().default("manuelle"), // ia | manuelle
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Une publication (planifiée ou publiée) sur une plateforme
export const publications = sqliteTable("publications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  format: text("format").notNull(), // carrousel | reel | story | post
  title: text("title").default(""),
  status: text("status").notNull().default("planifiee"), // planifiee | publiee
  plannedAt: integer("planned_at", { mode: "timestamp" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  url: text("url").default(""),
  ideaId: integer("idea_id").references(() => ideas.id, {
    onDelete: "set null",
  }),
});

// Relevé de statistiques — plusieurs relevés possibles par publication
export const statSnapshots = sqliteTable("stat_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicationId: integer("publication_id")
    .notNull()
    .references(() => publications.id, { onDelete: "cascade" }),
  recordedAt: integer("recorded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  impressions: integer("impressions").notNull().default(0),
  reach: integer("reach").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  followersGained: integer("followers_gained").notNull().default(0),
  conversions: integer("conversions").notNull().default(0), // contacts / ventes attribués
});

// Créneau horaire recommandé (générique Buffer ou personnalisé)
export const timeSlots = sqliteTable("time_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  contentType: text("content_type").notNull(), // post | reel | story
  dayOfWeek: integer("day_of_week").notNull(), // 0 = lundi … 6 = dimanche
  hour: integer("hour").notNull(), // 0-23
  strength: integer("strength").notNull().default(1), // 1 faible, 2 bon, 3 fort
  source: text("source").notNull().default("generique"), // generique | personnalise
});

// Mapping de colonnes CSV réutilisable (exports Buffer, Meta…)
export const csvMappings = sqliteTable("csv_mappings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  columnMap: text("column_map").notNull(), // JSON : { "colonne CSV": "champ stat" }
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Vue sauvegardée façon Notion (table / kanban / calendrier)
export const viewConfigs = sqliteTable("view_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entity: text("entity").notNull(), // idees | publications
  name: text("name").notNull(),
  type: text("type").notNull(), // table | kanban | calendrier
  config: text("config").notNull().default("{}"), // JSON : colonnes, regroupement, tri, filtres
});

// Règle de couleur conditionnelle, éditable dans /parametres
export const colorRules = sqliteTable("color_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entity: text("entity").notNull(), // idees | publications
  field: text("field").notNull(), // status, platform, format, deadline…
  operator: text("operator").notNull(), // egal | inferieur | superieur | proche
  value: text("value").notNull(),
  color: text("color").notNull(), // couleur appliquée à la ligne/carte
  label: text("label").default(""),
});

export type Account = typeof accounts.$inferSelect;
export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type StatSnapshot = typeof statSnapshots.$inferSelect;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type CsvMapping = typeof csvMappings.$inferSelect;
export type ViewConfig = typeof viewConfigs.$inferSelect;
export type ColorRule = typeof colorRules.$inferSelect;
