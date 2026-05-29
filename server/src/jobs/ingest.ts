import { v4 as uuidv4 } from "uuid";
import { getDb, schema } from "../db";
import { fetchGoogleAlerts, MockImapClient } from "../integrations/imap";
import { scrapeAllBrandPages, scrapeAppStorePages } from "../integrations/scraper";
import { checkDuplicate } from "../integrations/dedup";
import { mapConfidenceFromSource } from "../integrations/classify";
import type { SourceType } from "../../../shared/schemas";

const USE_MOCK = process.env.USE_MOCK_INTEGRATIONS === "true";

export async function runImapIngestion(): Promise<number> {
  const db = getDb();
  const config = await db.select().from(schema.user_config).limit(1);
  const cfg = config[0];

  let alerts;

  if (USE_MOCK) {
    const mock = new MockImapClient();
    alerts = await mock.fetchGoogleAlerts({} as any);
  } else {
    if (!cfg?.imap_host || !cfg?.imap_user || !cfg?.imap_password) {
      console.log("[Ingest] IMAP not configured, skipping");
      return 0;
    }
    alerts = await fetchGoogleAlerts({
      host: cfg.imap_host,
      port: cfg.imap_port || 993,
      auth: { user: cfg.imap_user, pass: cfg.imap_password },
    });
  }

  let inserted = 0;
  for (const alert of alerts) {
    const dupResult = await checkDuplicate(alert.exact_excerpt, alert.brand);
    const id = uuidv4();

    await db.insert(schema.signals).values({
      id,
      status: "pending",
      date_collected: new Date().toISOString().split("T")[0],
      brand: alert.brand,
      source_type: alert.source_type,
      url: alert.url,
      date_source_published: alert.date_source_published,
      exact_excerpt: alert.exact_excerpt,
      headline: alert.headline,
      ownership_narrative_elements: "[]",
      is_duplicate: dupResult.isDuplicate,
      duplicate_of_signal_id: dupResult.duplicateOf,
      confidence_level: mapConfidenceFromSource(alert.source_type as SourceType),
    });

    inserted++;
  }

  console.log(`[Ingest] Inserted ${inserted} alerts from IMAP`);
  return inserted;
}

export async function runScraperIngestion(): Promise<number> {
  const pages = await scrapeAllBrandPages();
  const db = getDb();
  let inserted = 0;

  for (const page of pages) {
    if (!page.changed) continue;

    const headline = `${page.brand} ${page.sourceType} page updated`;
    const dupResult = await checkDuplicate(page.content, page.brand);
    const id = uuidv4();

    await db.insert(schema.signals).values({
      id,
      status: "pending",
      date_collected: new Date().toISOString().split("T")[0],
      brand: page.brand,
      source_type: page.sourceType as SourceType,
      url: page.url,
      exact_excerpt: page.content.slice(0, 800),
      headline,
      ownership_narrative_elements: "[]",
      is_duplicate: dupResult.isDuplicate,
      duplicate_of_signal_id: dupResult.duplicateOf,
      confidence_level: mapConfidenceFromSource(page.sourceType as SourceType),
    });

    inserted++;
  }

  console.log(`[Ingest] Inserted ${inserted} signals from page scraping`);
  return inserted;
}

export async function runAppStoreIngestion(): Promise<number> {
  const pages = await scrapeAppStorePages();
  const db = getDb();
  let inserted = 0;

  for (const page of pages) {
    if (!page.changed) continue;

    const headline = `${page.brand} app store update detected`;
    const dupResult = await checkDuplicate(page.content, page.brand);
    const id = uuidv4();

    await db.insert(schema.signals).values({
      id,
      status: "pending",
      date_collected: new Date().toISOString().split("T")[0],
      brand: page.brand,
      source_type: "App Store",
      url: page.url,
      exact_excerpt: page.content.slice(0, 800),
      headline,
      ownership_narrative_elements: "[]",
      is_duplicate: dupResult.isDuplicate,
      duplicate_of_signal_id: dupResult.duplicateOf,
      confidence_level: "HIGH",
    });

    inserted++;
  }

  console.log(`[Ingest] Inserted ${inserted} signals from app store scraping`);
  return inserted;
}
