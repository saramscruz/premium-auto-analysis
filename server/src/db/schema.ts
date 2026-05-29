import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const signals = sqliteTable("signals", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  date_collected: text("date_collected").notNull(),
  brand: text("brand").notNull(),
  source_type: text("source_type").notNull(),
  url: text("url").notNull(),
  date_source_published: text("date_source_published"),
  market: text("market"),
  exact_excerpt: text("exact_excerpt").notNull(),
  headline: text("headline").notNull(),
  signal_summary: text("signal_summary"),
  signal_type: text("signal_type"),
  signal_type_confidence: real("signal_type_confidence"),
  ownership_narrative_elements: text("ownership_narrative_elements").notNull().default("[]"),
  product_design_choice: text("product_design_choice"),
  confidence_level: text("confidence_level"),
  limitation: text("limitation"),
  connected_to_alert: text("connected_to_alert"),
  possible_post_angle: text("possible_post_angle"),
  used_in_published_content: text("used_in_published_content"),
  notes: text("notes"),
  is_duplicate: integer("is_duplicate", { mode: "boolean" }).notNull().default(false),
  duplicate_of_signal_id: text("duplicate_of_signal_id"),
  synced_to_sheets: integer("synced_to_sheets", { mode: "boolean" }).notNull().default(false),
  sheets_row_number: integer("sheets_row_number"),
  ai_suggestion: text("ai_suggestion"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const ingested_uids = sqliteTable("ingested_uids", {
  uid: text("uid").primaryKey(),
  source: text("source").notNull(),
  ingested_at: text("ingested_at").notNull().default(sql`(datetime('now'))`),
});

export const user_config = sqliteTable("user_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  google_sheets_id: text("google_sheets_id"),
  email_alerts_address: text("email_alerts_address"),
  imap_host: text("imap_host"),
  imap_port: integer("imap_port"),
  imap_user: text("imap_user"),
  imap_password: text("imap_password"),
  brands_to_monitor: text("brands_to_monitor").notNull().default('["Mercedes-Benz","BMW","Audi","Volvo","Porsche"]'),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const health_checks = sqliteTable("health_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  status: text("status").notNull().default("unknown"),
  message: text("message").notNull().default(""),
  last_checked: text("last_checked").notNull().default(sql`(datetime('now'))`),
  metrics: text("metrics").notNull().default("{}"),
});

export const analytics = sqliteTable("analytics", {
  id: text("id").primaryKey(),
  week: integer("week").notNull(),
  signal_count: integer("signal_count").notNull().default(0),
  by_source: text("by_source").notNull().default("{}"),
  by_brand: text("by_brand").notNull().default("{}"),
  by_ownership_element: text("by_ownership_element").notNull().default("{}"),
  patterns_detected: text("patterns_detected").notNull().default("[]"),
  duplicate_rate: real("duplicate_rate").notNull().default(0),
  content_angle_suggestions: text("content_angle_suggestions").notNull().default("[]"),
  generated_at: text("generated_at").notNull().default(sql`(datetime('now'))`),
});

export const scraper_cache = sqliteTable("scraper_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brand: text("brand").notNull(),
  source_type: text("source_type").notNull(),
  url: text("url").notNull(),
  content_hash: text("content_hash").notNull(),
  content: text("content").notNull(),
  scraped_at: text("scraped_at").notNull().default(sql`(datetime('now'))`),
});
