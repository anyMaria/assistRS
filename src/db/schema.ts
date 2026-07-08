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
  color: text("color").notNull().default("#F5352B"),
  // Taux horaire optionnel (en centimes) — valorise le temps passé dans le rapport mensuel.
  hourlyRateCents: integer("hourly_rate_cents"),
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
  pillar: text("pillar").default(""), // pilier de la ligne éditoriale de la marque (brand_editorial.pillars)
  feasibility: text("feasibility").default(""), // faible | moyenne | elevee (temps de production estimé)
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
  visualUrl: text("visual_url").default(""), // aperçu du visuel final (URL directe pour l'instant)
  caption: text("caption").default(""), // légende appliquée (générée par IA ou saisie à la main)
  ideaId: integer("idea_id").references(() => ideas.id, {
    onDelete: "set null",
  }),
  bufferPostId: text("buffer_post_id"), // id du post Buffer une fois envoyé (G14/G11)
});

// Visuel transitoire uploadé pour une publication — hébergement Blob public, purgé J+7
// après envoi Buffer (G14). Buffer copie les médias chez lui, ces blobs ne servent qu'à ça.
export const publicationAssets = sqliteTable("publication_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicationId: integer("publication_id")
    .notNull()
    .references(() => publications.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  position: integer("position").notNull().default(0),
  sizeBytes: integer("size_bytes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
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

// Contexte d'entreprise de la marque (1-1 accounts) — CONCEPTION.md §3.1
export const brandProfiles = sqliteTable("brand_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: "cascade" }),
  size: text("size").default(""), // solo | tpe | pme | collectivite
  location: text("location").default(""),
  description: text("description").default(""),
  offering: text("offering").default(""),
  positioning: text("positioning").default(""),
  personas: text("personas").default(""),
  keyPeople: text("key_people").notNull().default("[]"), // JSON [{name, role, contact, prefs}]
  competitors: text("competitors").notNull().default("[]"), // JSON [string]
  seasonality: text("seasonality").notNull().default("[]"), // JSON [{label, period}]
  links: text("links").notNull().default("[]"), // JSON [{platform, url}]
});

// Identité visuelle (1-1 accounts) — CONCEPTION.md §3.2
export const brandIdentity = sqliteTable("brand_identity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: "cascade" }),
  palette: text("palette").notNull().default("[]"), // JSON [{name, hex}]
  fonts: text("fonts").notNull().default("[]"), // JSON [{name, usage}]
  imageStyle: text("image_style").default(""),
  usageRules: text("usage_rules").default(""),
});

// Assets réutilisables (logo, gabarit, photo, moodboard) — CONCEPTION.md §3.2
export const brandAssets = sqliteTable("brand_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("logo"), // logo | gabarit | photo | moodboard
  blobUrl: text("blob_url").notNull().default(""),
  name: text("name").notNull().default(""),
  tags: text("tags").notNull().default("[]"), // JSON [string]
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Ligne éditoriale (1-1 accounts) — CONCEPTION.md §3.3
export const brandEditorial = sqliteTable("brand_editorial", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: "cascade" }),
  mainMessage: text("main_message").default(""),
  secondaryMessages: text("secondary_messages").notNull().default("[]"), // JSON [string]
  pillars: text("pillars").notNull().default("[]"), // JSON [{name, sharePercent}]
  toneVoice: text("tone_voice").default(""),
  toneExamples: text("tone_examples").notNull().default("[]"), // JSON [{onDit, onNeDitPas}]
  dos: text("dos").notNull().default("[]"), // JSON [string]
  donts: text("donts").notNull().default("[]"), // JSON [string]
  baseHashtags: text("base_hashtags").notNull().default("[]"), // JSON [string]
  bannedHashtags: text("banned_hashtags").notNull().default("[]"), // JSON [string]
  emojiPolicy: text("emoji_policy").notNull().default("parcimonie"), // jamais | parcimonie | librement
  ctas: text("ctas").notNull().default("[]"), // JSON [string]
  languages: text("languages").default("fr"),
  legalMentions: text("legal_mentions").default(""),
});

// Mémoire de corrections IA (1-n accounts) — CONCEPTION.md §3.4
export const brandMemoryRules = sqliteTable("brand_memory_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  rule: text("rule").notNull(),
  origin: text("origin").default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Une recherche d'inspiration lancée sur une source (Pinterest, Instagram…)
export const inspirationSearches = sqliteTable("inspiration_searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  theme: text("theme").notNull(),
  normalizedTheme: text("normalized_theme").notNull(), // sans accents, mots-clés — clé de cache
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  source: text("source").notNull(), // pinterest | instagram | linkedin | facebook | metaAds
  periode: text("periode").notNull().default("toutes"),
  tri: text("tri").notNull().default("recent"),
  maxItems: integer("max_items").notNull().default(30),
  status: text("status").notNull().default("en_cours"), // en_cours | termine | erreur
  apifyRunId: text("apify_run_id"),
  apifyDatasetId: text("apify_dataset_id"),
  costCents: integer("cost_cents").notNull().default(0),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  origin: text("origin").notNull().default("manuelle"), // manuelle | cron
  queryUsed: text("query_used"), // requête réellement envoyée à l'actor (optimisée par Gemini ou fallback)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Un visuel d'inspiration ramené par une recherche
export const inspirationItems = sqliteTable("inspiration_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  searchId: integer("search_id")
    .notNull()
    .references(() => inspirationSearches.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  imageUrl: text("image_url").notNull(),
  blobThumbUrl: text("blob_thumb_url"), // copie pérenne (les URLs scrapées expirent)
  author: text("author").default(""),
  title: text("title").notNull().default(""),
  postedAt: integer("posted_at", { mode: "timestamp" }),
  metrics: text("metrics").notNull().default("{}"), // JSON, signaux propres à la source
  originalUrl: text("original_url").default(""),
  relevant: integer("relevant", { mode: "boolean" }).notNull().default(true), // tri de pertinence Gemini
  pinnedBoardId: integer("pinned_board_id").references(() => moodboards.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Moodboard : par marque, ou libre/thématique (accountId nul)
export const moodboards = sqliteTable("moodboards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  theme: text("theme").default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Suivi des coûts des API externes (budget ~5 €/mois)
export const apiUsage = sqliteTable("api_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  service: text("service").notNull(), // apify | gemini | resend
  action: text("action").notNull(),
  costCents: integer("cost_cents").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Étape de la checklist de production d'une publication (5 par publication).
export const productionSteps = sqliteTable("production_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicationId: integer("publication_id")
    .notNull()
    .references(() => publications.id, { onDelete: "cascade" }),
  key: text("key").notNull(), // brief | maquette | envoye | valide | programme
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  doneAt: integer("done_at", { mode: "timestamp" }),
});

// Publication récurrente : génère automatiquement les occurrences à venir.
export const recurrences = sqliteTable("recurrences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  format: text("format").notNull(),
  titlePattern: text("title_pattern").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = lundi … 6 = dimanche (cohérent avec time_slots)
  hour: integer("hour").notNull(),
  freq: text("freq").notNull().default("hebdo"), // hebdo | mensuel
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastGeneratedUntil: integer("last_generated_until", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Token secret révocable pour l'abonnement iCal (Google Calendar / iPhone).
export const icalTokens = sqliteTable("ical_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});

// Session du rituel mensuel (un par marque et par mois) : réponses au wizard,
// calendrier proposé par l'IA, et statut de validation.
export const monthlyRituals = sqliteTable("monthly_rituals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  month: text("month").notNull(), // "YYYY-MM"
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  answers: text("answers").notNull().default("{}"), // JSON : quoiDeNeuf, promos, evenements, contraintes
  proposal: text("proposal").notNull().default("[]"), // JSON : { date, plateforme, format, pilier, titre, accroche }[]
  status: text("status").notNull().default("brouillon"), // brouillon | propose | valide
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Objectif chiffré par marque, sur une période donnée.
export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  metric: text("metric").notNull(), // abonnes | engagement | conversions
  // abonnes/conversions : nombre entier. engagement : points de base (450 = 4,50 %).
  target: integer("target").notNull(),
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Saisie de temps passé — base de facturation, valorisée si taux horaire renseigné.
export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  publicationId: integer("publication_id").references(() => publications.id, {
    onDelete: "set null",
  }),
  minutes: integer("minutes").notNull(),
  note: text("note").default(""),
  date: integer("date", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Rapport PDF mensuel généré pour une marque.
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // "YYYY-MM"
  blobUrl: text("blob_url"), // pathname du blob privé, null si Blob non configuré à la génération
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Retour client archivé (verbatim, pas une règle) — rattaché à une marque, et
// optionnellement à une publication précise. CONCEPTION.md §G12.
export const brandClientNotes = sqliteTable("brand_client_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  publicationId: integer("publication_id").references(() => publications.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Pense-bête d'idées en vrac — étape amont d'une vraie idée, vit dans la base d'idées.
export const ideaNotes = sqliteTable("idea_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Génération IA (légende, idées, calendrier, analyse, amélioration) — CONCEPTION.md §10
export const generations = sqliteTable("generations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  publicationId: integer("publication_id").references(() => publications.id, { onDelete: "set null" }),
  ideaId: integer("idea_id").references(() => ideas.id, { onDelete: "set null" }),
  kind: text("kind").notNull(), // legende | idees | calendrier | analyse | amelioration
  promptSummary: text("prompt_summary").default(""),
  output: text("output").notNull().default(""),
  editedOutput: text("edited_output").default(""),
  appliedAt: integer("applied_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Account = typeof accounts.$inferSelect;
export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type PublicationAsset = typeof publicationAssets.$inferSelect;
export type StatSnapshot = typeof statSnapshots.$inferSelect;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type CsvMapping = typeof csvMappings.$inferSelect;
export type ViewConfig = typeof viewConfigs.$inferSelect;
export type ColorRule = typeof colorRules.$inferSelect;
export type BrandProfile = typeof brandProfiles.$inferSelect;
export type BrandIdentity = typeof brandIdentity.$inferSelect;
export type BrandAsset = typeof brandAssets.$inferSelect;
export type BrandEditorial = typeof brandEditorial.$inferSelect;
export type BrandMemoryRule = typeof brandMemoryRules.$inferSelect;
export type InspirationSearch = typeof inspirationSearches.$inferSelect;
export type InspirationItem = typeof inspirationItems.$inferSelect;
export type Moodboard = typeof moodboards.$inferSelect;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type ProductionStep = typeof productionSteps.$inferSelect;
export type Recurrence = typeof recurrences.$inferSelect;
export type IcalToken = typeof icalTokens.$inferSelect;
export type MonthlyRitual = typeof monthlyRituals.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Generation = typeof generations.$inferSelect;
export type BrandClientNote = typeof brandClientNotes.$inferSelect;
export type IdeaNote = typeof ideaNotes.$inferSelect;
