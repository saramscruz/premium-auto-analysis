import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "premium-auto.db");

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;

export function getDb() {
  if (!_db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    _sqlite = new Database(DB_PATH);
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("foreign_keys = ON");
    _db = drizzle(_sqlite, { schema });

    runMigrations(_sqlite);
  }
  return _db;
}

function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      date_collected TEXT NOT NULL,
      brand TEXT NOT NULL,
      source_type TEXT NOT NULL,
      url TEXT NOT NULL,
      date_source_published TEXT,
      market TEXT,
      exact_excerpt TEXT NOT NULL,
      headline TEXT NOT NULL,
      signal_summary TEXT,
      signal_type TEXT,
      signal_type_confidence REAL,
      ownership_narrative_elements TEXT NOT NULL DEFAULT '[]',
      product_design_choice TEXT,
      confidence_level TEXT,
      limitation TEXT,
      connected_to_alert TEXT,
      possible_post_angle TEXT,
      used_in_published_content TEXT,
      notes TEXT,
      is_duplicate INTEGER NOT NULL DEFAULT 0,
      duplicate_of_signal_id TEXT,
      synced_to_sheets INTEGER NOT NULL DEFAULT 0,
      sheets_row_number INTEGER,
      ai_suggestion TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ingested_uids (
      uid TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_sheets_id TEXT,
      email_alerts_address TEXT,
      imap_host TEXT,
      imap_port INTEGER,
      imap_user TEXT,
      imap_password TEXT,
      brands_to_monitor TEXT NOT NULL DEFAULT '["Mercedes-Benz","BMW","Audi","Volvo","Porsche"]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'unknown',
      message TEXT NOT NULL DEFAULT '',
      last_checked TEXT NOT NULL DEFAULT (datetime('now')),
      metrics TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS scraper_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      source_type TEXT NOT NULL,
      url TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      content TEXT NOT NULL,
      scraped_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      week INTEGER NOT NULL,
      signal_count INTEGER NOT NULL DEFAULT 0,
      by_source TEXT NOT NULL DEFAULT '{}',
      by_brand TEXT NOT NULL DEFAULT '{}',
      by_ownership_element TEXT NOT NULL DEFAULT '{}',
      patterns_detected TEXT NOT NULL DEFAULT '[]',
      duplicate_rate REAL NOT NULL DEFAULT 0,
      content_angle_suggestions TEXT NOT NULL DEFAULT '[]',
      generated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO user_config (id) VALUES (1);
  `);
}

export { schema };
