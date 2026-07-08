import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// Route temporaire : compare le schéma Drizzle attendu à l'état réel de la base
// Turso de prod (PRAGMA table_info) et ajoute les colonnes manquantes (ALTER TABLE
// ADD COLUMN). Corrige le drift accumulé (buffer_post_id, retry_count, etc.) en une
// fois. À supprimer après exécution.

// { table: [ [colonneSQL, ddlType], ... ] } — reflète src/db/schema.ts
const EXPECTED: Record<string, [string, string][]> = {
  accounts: [
    ["name", "TEXT NOT NULL"],
    ["sector", "TEXT DEFAULT ''"],
    ["tone", "TEXT DEFAULT ''"],
    ["audience", "TEXT DEFAULT ''"],
    ["platforms", "TEXT NOT NULL DEFAULT '[]'"],
    ["notes", "TEXT DEFAULT ''"],
    ["validation_delay_days", "INTEGER NOT NULL DEFAULT 3"],
    ["color", "TEXT NOT NULL DEFAULT '#F5352B'"],
    ["hourly_rate_cents", "INTEGER"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  content_templates: [
    ["title", "TEXT NOT NULL"],
    ["format", "TEXT NOT NULL"],
    ["platforms", "TEXT NOT NULL DEFAULT '[]'"],
    ["objective", "TEXT NOT NULL"],
    ["hook", "TEXT DEFAULT ''"],
    ["structure", "TEXT NOT NULL"],
    ["cta", "TEXT DEFAULT ''"],
    ["origin", "TEXT NOT NULL DEFAULT 'personnalise'"],
  ],
  ideas: [
    ["account_id", "INTEGER NOT NULL"],
    ["theme", "TEXT NOT NULL"],
    ["title", "TEXT NOT NULL"],
    ["format", "TEXT DEFAULT 'post'"],
    ["platform", "TEXT DEFAULT ''"],
    ["pillar", "TEXT DEFAULT ''"],
    ["feasibility", "TEXT DEFAULT ''"],
    ["content", "TEXT NOT NULL"],
    ["status", "TEXT NOT NULL DEFAULT 'idee'"],
    ["source", "TEXT NOT NULL DEFAULT 'manuelle'"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  publications: [
    ["account_id", "INTEGER NOT NULL"],
    ["platform", "TEXT NOT NULL"],
    ["format", "TEXT NOT NULL"],
    ["title", "TEXT DEFAULT ''"],
    ["status", "TEXT NOT NULL DEFAULT 'planifiee'"],
    ["planned_at", "INTEGER"],
    ["published_at", "INTEGER"],
    ["url", "TEXT DEFAULT ''"],
    ["visual_url", "TEXT DEFAULT ''"],
    ["caption", "TEXT DEFAULT ''"],
    ["idea_id", "INTEGER"],
    ["buffer_post_id", "TEXT"],
  ],
  publication_assets: [
    ["publication_id", "INTEGER NOT NULL"],
    ["url", "TEXT NOT NULL"],
    ["pathname", "TEXT NOT NULL"],
    ["position", "INTEGER NOT NULL DEFAULT 0"],
    ["size_bytes", "INTEGER NOT NULL DEFAULT 0"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  stat_snapshots: [
    ["publication_id", "INTEGER NOT NULL"],
    ["recorded_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
    ["impressions", "INTEGER NOT NULL DEFAULT 0"],
    ["reach", "INTEGER NOT NULL DEFAULT 0"],
    ["likes", "INTEGER NOT NULL DEFAULT 0"],
    ["comments", "INTEGER NOT NULL DEFAULT 0"],
    ["shares", "INTEGER NOT NULL DEFAULT 0"],
    ["saves", "INTEGER NOT NULL DEFAULT 0"],
    ["clicks", "INTEGER NOT NULL DEFAULT 0"],
    ["followers_gained", "INTEGER NOT NULL DEFAULT 0"],
    ["conversions", "INTEGER NOT NULL DEFAULT 0"],
  ],
  time_slots: [
    ["platform", "TEXT NOT NULL"],
    ["content_type", "TEXT NOT NULL"],
    ["day_of_week", "INTEGER NOT NULL"],
    ["hour", "INTEGER NOT NULL"],
    ["strength", "INTEGER NOT NULL DEFAULT 1"],
    ["source", "TEXT NOT NULL DEFAULT 'generique'"],
  ],
  csv_mappings: [
    ["name", "TEXT NOT NULL"],
    ["column_map", "TEXT NOT NULL"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  view_configs: [
    ["entity", "TEXT NOT NULL"],
    ["name", "TEXT NOT NULL"],
    ["type", "TEXT NOT NULL"],
    ["config", "TEXT NOT NULL DEFAULT '{}'"],
  ],
  color_rules: [
    ["entity", "TEXT NOT NULL"],
    ["field", "TEXT NOT NULL"],
    ["operator", "TEXT NOT NULL"],
    ["value", "TEXT NOT NULL"],
    ["color", "TEXT NOT NULL"],
    ["label", "TEXT DEFAULT ''"],
  ],
  brand_profiles: [
    ["account_id", "INTEGER NOT NULL"],
    ["size", "TEXT DEFAULT ''"],
    ["location", "TEXT DEFAULT ''"],
    ["description", "TEXT DEFAULT ''"],
    ["offering", "TEXT DEFAULT ''"],
    ["positioning", "TEXT DEFAULT ''"],
    ["personas", "TEXT DEFAULT ''"],
    ["key_people", "TEXT NOT NULL DEFAULT '[]'"],
    ["competitors", "TEXT NOT NULL DEFAULT '[]'"],
    ["seasonality", "TEXT NOT NULL DEFAULT '[]'"],
    ["links", "TEXT NOT NULL DEFAULT '[]'"],
  ],
  brand_identity: [
    ["account_id", "INTEGER NOT NULL"],
    ["palette", "TEXT NOT NULL DEFAULT '[]'"],
    ["fonts", "TEXT NOT NULL DEFAULT '[]'"],
    ["image_style", "TEXT DEFAULT ''"],
    ["usage_rules", "TEXT DEFAULT ''"],
  ],
  brand_assets: [
    ["account_id", "INTEGER NOT NULL"],
    ["type", "TEXT NOT NULL DEFAULT 'logo'"],
    ["blob_url", "TEXT NOT NULL DEFAULT ''"],
    ["name", "TEXT NOT NULL DEFAULT ''"],
    ["tags", "TEXT NOT NULL DEFAULT '[]'"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  brand_editorial: [
    ["account_id", "INTEGER NOT NULL"],
    ["main_message", "TEXT DEFAULT ''"],
    ["secondary_messages", "TEXT NOT NULL DEFAULT '[]'"],
    ["pillars", "TEXT NOT NULL DEFAULT '[]'"],
    ["tone_voice", "TEXT DEFAULT ''"],
    ["tone_examples", "TEXT NOT NULL DEFAULT '[]'"],
    ["dos", "TEXT NOT NULL DEFAULT '[]'"],
    ["donts", "TEXT NOT NULL DEFAULT '[]'"],
    ["base_hashtags", "TEXT NOT NULL DEFAULT '[]'"],
    ["banned_hashtags", "TEXT NOT NULL DEFAULT '[]'"],
    ["emoji_policy", "TEXT NOT NULL DEFAULT 'parcimonie'"],
    ["ctas", "TEXT NOT NULL DEFAULT '[]'"],
    ["languages", "TEXT DEFAULT 'fr'"],
    ["legal_mentions", "TEXT DEFAULT ''"],
  ],
  brand_memory_rules: [
    ["account_id", "INTEGER NOT NULL"],
    ["rule", "TEXT NOT NULL"],
    ["origin", "TEXT DEFAULT ''"],
    ["active", "INTEGER NOT NULL DEFAULT 1"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  inspiration_searches: [
    ["theme", "TEXT NOT NULL"],
    ["normalized_theme", "TEXT NOT NULL"],
    ["account_id", "INTEGER"],
    ["source", "TEXT NOT NULL"],
    ["periode", "TEXT NOT NULL DEFAULT 'toutes'"],
    ["tri", "TEXT NOT NULL DEFAULT 'recent'"],
    ["max_items", "INTEGER NOT NULL DEFAULT 30"],
    ["status", "TEXT NOT NULL DEFAULT 'en_cours'"],
    ["apify_run_id", "TEXT"],
    ["apify_dataset_id", "TEXT"],
    ["cost_cents", "INTEGER NOT NULL DEFAULT 0"],
    ["error_message", "TEXT"],
    ["retry_count", "INTEGER NOT NULL DEFAULT 0"],
    ["origin", "TEXT NOT NULL DEFAULT 'manuelle'"],
    ["query_used", "TEXT"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  inspiration_items: [
    ["search_id", "INTEGER NOT NULL"],
    ["source", "TEXT NOT NULL"],
    ["image_url", "TEXT NOT NULL"],
    ["blob_thumb_url", "TEXT"],
    ["author", "TEXT DEFAULT ''"],
    ["title", "TEXT NOT NULL DEFAULT ''"],
    ["posted_at", "INTEGER"],
    ["metrics", "TEXT NOT NULL DEFAULT '{}'"],
    ["original_url", "TEXT DEFAULT ''"],
    ["relevant", "INTEGER NOT NULL DEFAULT 1"],
    ["pinned_board_id", "INTEGER"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  moodboards: [
    ["account_id", "INTEGER"],
    ["name", "TEXT NOT NULL"],
    ["theme", "TEXT DEFAULT ''"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  api_usage: [
    ["service", "TEXT NOT NULL"],
    ["action", "TEXT NOT NULL"],
    ["cost_cents", "INTEGER NOT NULL DEFAULT 0"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  production_steps: [
    ["publication_id", "INTEGER NOT NULL"],
    ["key", "TEXT NOT NULL"],
    ["done", "INTEGER NOT NULL DEFAULT 0"],
    ["done_at", "INTEGER"],
  ],
  recurrences: [
    ["account_id", "INTEGER NOT NULL"],
    ["platform", "TEXT NOT NULL"],
    ["format", "TEXT NOT NULL"],
    ["title_pattern", "TEXT NOT NULL"],
    ["day_of_week", "INTEGER NOT NULL"],
    ["hour", "INTEGER NOT NULL"],
    ["freq", "TEXT NOT NULL DEFAULT 'hebdo'"],
    ["active", "INTEGER NOT NULL DEFAULT 1"],
    ["last_generated_until", "INTEGER"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  ical_tokens: [
    ["token", "TEXT NOT NULL"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
    ["revoked_at", "INTEGER"],
  ],
  monthly_rituals: [
    ["month", "TEXT NOT NULL"],
    ["account_id", "INTEGER NOT NULL"],
    ["answers", "TEXT NOT NULL DEFAULT '{}'"],
    ["proposal", "TEXT NOT NULL DEFAULT '[]'"],
    ["status", "TEXT NOT NULL DEFAULT 'brouillon'"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  goals: [
    ["account_id", "INTEGER NOT NULL"],
    ["metric", "TEXT NOT NULL"],
    ["target", "INTEGER NOT NULL"],
    ["period_start", "INTEGER NOT NULL"],
    ["period_end", "INTEGER NOT NULL"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  time_entries: [
    ["account_id", "INTEGER NOT NULL"],
    ["publication_id", "INTEGER"],
    ["minutes", "INTEGER NOT NULL"],
    ["note", "TEXT DEFAULT ''"],
    ["date", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  reports: [
    ["account_id", "INTEGER NOT NULL"],
    ["month", "TEXT NOT NULL"],
    ["blob_url", "TEXT"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
  generations: [
    ["account_id", "INTEGER NOT NULL"],
    ["publication_id", "INTEGER"],
    ["idea_id", "INTEGER"],
    ["kind", "TEXT NOT NULL"],
    ["prompt_summary", "TEXT DEFAULT ''"],
    ["output", "TEXT NOT NULL DEFAULT ''"],
    ["edited_output", "TEXT DEFAULT ''"],
    ["applied_at", "INTEGER"],
    ["created_at", "INTEGER NOT NULL DEFAULT (unixepoch())"],
  ],
};

// Tables absentes en prod (jamais créées par un db:push), avec leur DDL complet.
const MISSING_TABLES: Record<string, string> = {
  publication_assets: `CREATE TABLE publication_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publication_id INTEGER NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    pathname TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
};

const ONE_TIME_TOKEN = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!ONE_TIME_TOKEN || auth !== `Bearer ${ONE_TIME_TOKEN}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const added: string[] = [];
  const tablesCreated: string[] = [];
  const skippedMissingTable: string[] = [];
  const errors: { table: string; column: string; error: string }[] = [];

  for (const [table, columns] of Object.entries(EXPECTED)) {
    let existing: Set<string>;
    try {
      const info = await db.all<{ name: string }>(
        sql.raw(`PRAGMA table_info(${table})`)
      );
      if (info.length === 0) {
        if (MISSING_TABLES[table]) {
          try {
            await db.run(sql.raw(MISSING_TABLES[table]));
            tablesCreated.push(table);
            existing = new Set(columns.map(([c]) => c).concat("id"));
          } catch (e) {
            errors.push({ table, column: "*", error: e instanceof Error ? e.message : String(e) });
            continue;
          }
        } else {
          skippedMissingTable.push(table);
          continue;
        }
      } else {
        existing = new Set(info.map((row) => row.name));
      }
    } catch (e) {
      errors.push({ table, column: "*", error: e instanceof Error ? e.message : String(e) });
      continue;
    }

    for (const [column, ddlType] of columns) {
      if (existing.has(column)) continue;
      try {
        await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddlType}`));
        added.push(`${table}.${column}`);
      } catch (e) {
        errors.push({ table, column, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  return NextResponse.json({ ok: errors.length === 0, added, tablesCreated, skippedMissingTable, errors });
}
