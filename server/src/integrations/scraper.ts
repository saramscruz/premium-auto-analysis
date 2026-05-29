import * as cheerio from "cheerio";
import crypto from "crypto";
import { getDb, schema } from "../db";
import { and, eq } from "drizzle-orm";
import { BRANDS, BrandConfig } from "./brands.config";
import { v4 as uuidv4 } from "uuid";

export interface ScrapedPage {
  brand: string;
  sourceType: string;
  url: string;
  content: string;
  changed: boolean;
  previousContent: string | null;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

function extractText(html: string, selector: string): string {
  const $ = cheerio.load(html);
  const texts: string[] = [];
  $(selector).each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 30) texts.push(t);
  });
  return texts.join("\n\n").slice(0, 3000);
}

function hash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export async function scrapeAllBrandPages(): Promise<ScrapedPage[]> {
  const db = getDb();
  const results: ScrapedPage[] = [];

  for (const brand of BRANDS) {
    for (const [sourceType, url, selector] of [
      ["Official App Page", brand.appPageUrl, brand.appPageSelector] as const,
      ["Sales/Marketing", brand.salesPageUrl, brand.salesPageSelector] as const,
    ]) {
      try {
        const html = await fetchPage(url);
        const content = extractText(html, selector);
        if (!content) continue;

        const contentHash = hash(content);

        const existing = await db
          .select()
          .from(schema.scraper_cache)
          .where(
            and(
              eq(schema.scraper_cache.brand, brand.name),
              eq(schema.scraper_cache.source_type, sourceType)
            )
          )
          .limit(1);

        const previousContent = existing[0]?.content || null;
        const changed = !existing[0] || existing[0].content_hash !== contentHash;

        if (changed) {
          if (existing[0]) {
            await db
              .update(schema.scraper_cache)
              .set({ content, content_hash: contentHash, scraped_at: new Date().toISOString() })
              .where(
                and(
                  eq(schema.scraper_cache.brand, brand.name),
                  eq(schema.scraper_cache.source_type, sourceType)
                )
              );
          } else {
            await db.insert(schema.scraper_cache).values({
              brand: brand.name,
              source_type: sourceType,
              url,
              content,
              content_hash: contentHash,
            });
          }
        }

        results.push({ brand: brand.name, sourceType, url, content, changed, previousContent });
      } catch (err) {
        console.error(`[Scraper] Failed to scrape ${brand.name} ${sourceType}:`, err);
      }
    }
  }

  return results;
}

export async function scrapeAppStorePages(): Promise<ScrapedPage[]> {
  const results: ScrapedPage[] = [];
  const db = getDb();

  for (const brand of BRANDS) {
    try {
      const html = await fetchPage(brand.appStoreUrl);
      const $ = cheerio.load(html);

      const whatsNew = $('[data-testid="whatsnew-description"], .recent-change, .whats-new').text().trim();
      const version = $('[itemprop="softwareVersion"], .current-version').text().trim();
      const appName = $('h1[itemprop="name"], .app-title').first().text().trim();

      if (!whatsNew) continue;

      const content = version ? `v${version}: ${whatsNew}` : whatsNew;
      const contentHash = hash(content);

      const existing = await db
        .select()
        .from(schema.scraper_cache)
        .where(
          and(
            eq(schema.scraper_cache.brand, brand.name),
            eq(schema.scraper_cache.source_type, "App Store")
          )
        )
        .limit(1);

      const changed = !existing[0] || existing[0].content_hash !== contentHash;

      if (changed) {
        if (existing[0]) {
          await db
            .update(schema.scraper_cache)
            .set({ content, content_hash: contentHash, scraped_at: new Date().toISOString() })
            .where(
              and(
                eq(schema.scraper_cache.brand, brand.name),
                eq(schema.scraper_cache.source_type, "App Store")
              )
            );
        } else {
          await db.insert(schema.scraper_cache).values({
            brand: brand.name,
            source_type: "App Store",
            url: brand.appStoreUrl,
            content,
            content_hash: contentHash,
          });
        }
      }

      results.push({
        brand: brand.name,
        sourceType: "App Store",
        url: brand.appStoreUrl,
        content,
        changed,
        previousContent: existing[0]?.content || null,
      });
    } catch (err) {
      console.error(`[AppStore] Failed to scrape ${brand.name}:`, err);
    }
  }

  return results;
}
