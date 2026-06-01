import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getDb, schema } from "../db";
import { eq, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { detectBrandFromText, detectSourceType } from "./classify";

export interface IngestedSignal {
  brand: string;
  source_type: string;
  url: string;
  headline: string;
  exact_excerpt: string;
  date_source_published: string | null;
}

export interface ImapConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
}

export async function fetchGoogleAlerts(config: ImapConfig): Promise<IngestedSignal[]> {
  const db = getDb();
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.port === 993,
    auth: config.auth,
    logger: false,
  });

  const newSignals: IngestedSignal[] = [];

  try {
    await client.connect();
    const boxes = await client.list();
    console.log(`[IMAP] Available mailboxes: ${boxes.map(b => b.path).join(", ")}`);
    const alertsBox = boxes.find(b => b.path.toLowerCase().includes("unprocessed")) ||
                      boxes.find(b => b.path.toLowerCase().includes("google alerts"));
    const mailboxPath = alertsBox?.path || "INBOX";
    console.log(`[IMAP] Using mailbox: ${mailboxPath}`);
    const lock = await client.getMailboxLock(mailboxPath);

    try {
      const messages = await client.search({ seen: false, from: "googlealerts-noreply@google.com" } as any);
      if (!messages || messages.length === 0) return [];

      const existingUids = await db
        .select({ uid: schema.ingested_uids.uid })
        .from(schema.ingested_uids)
        .where(eq(schema.ingested_uids.source, "imap"));

      const seenSet = new Set(existingUids.map((r) => r.uid));
      const newUids = messages.filter((uid) => !seenSet.has(String(uid)));

      for (const uid of newUids) {
        try {
          const msg = await client.fetchOne(String(uid), { source: true });
          if (!msg || typeof msg === "boolean" || !(msg as any).source) continue;

          const parsed = await simpleParser((msg as any).source);
          const text = parsed.text || "";
          const html = parsed.html || "";
          const subject = parsed.subject || "";
          const date = parsed.date ? parsed.date.toISOString().split("T")[0] : null;

          const urls = extractUrls(html || text);
          const brand = detectBrandFromText(subject + " " + text);
          if (!brand) continue;

          const primaryUrl = urls[0] || "";
          const excerpt = extractExcerptFromAlert(text, html);

          newSignals.push({
            brand,
            source_type: "Alert",
            url: primaryUrl,
            headline: subject,
            exact_excerpt: excerpt,
            date_source_published: date,
          });

          await db.insert(schema.ingested_uids).values({
            uid: String(uid),
            source: "imap",
          }).onConflictDoNothing();
        } catch (err) {
          console.error(`[IMAP] Error processing UID ${uid}:`, err);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("[IMAP] Connection error:", err);
    throw err;
  }

  return newSignals;
}

function extractUrls(content: string): string[] {
  const urlRegex = /https?:\/\/[^\s"<>]+/g;
  const raw = content.match(urlRegex) || [];
  return raw
    .filter((u) => !u.includes("google.com/alerts"))
    .filter((u) => !u.includes("accounts.google"))
    .slice(0, 3);
}

function extractExcerptFromAlert(text: string, html: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 40 && !l.startsWith("http") && !l.includes("unsubscribe") && !l.includes("Google Alerts"));

  return lines.slice(0, 3).join(" ").slice(0, 800) || text.slice(0, 400);
}

export class MockImapClient {
  async fetchGoogleAlerts(_config: ImapConfig): Promise<IngestedSignal[]> {
    const mockAlerts: IngestedSignal[] = [
      {
        brand: "Mercedes-Benz",
        source_type: "Alert",
        url: "https://techcrunch.com/mock-mercedes-app-update",
        headline: "Mercedes me app now supports remote climate control via updated Android app",
        exact_excerpt:
          "Mercedes-Benz has updated its Mercedes me app to support remote climate pre-conditioning, allowing drivers to set their cabin temperature before entering the vehicle. The feature is available on all EQ and select ICE models with active Mercedes me connect subscription.",
        date_source_published: new Date().toISOString().split("T")[0],
      },
      {
        brand: "Volvo",
        source_type: "Alert",
        url: "https://electrek.co/mock-volvo-ev-app",
        headline: "Volvo Cars app update adds real-time charging status with predictive range",
        exact_excerpt:
          "Volvo Cars has released version 3.5.0 of its companion app, introducing real-time charging status with predictive range calculation. The update also expands the EV charging network integration to support over 50 charging networks directly through the app.",
        date_source_published: new Date().toISOString().split("T")[0],
      },
      {
        brand: "BMW",
        source_type: "Alert",
        url: "https://bmwblog.com/mock-mybmw-ai",
        headline: "MyBMW app introduces AI-powered route optimization for electric vehicles",
        exact_excerpt:
          "BMW's MyBMW app has introduced an AI-powered route optimization feature that calculates the most efficient route for electric vehicle drivers, taking into account charging stop locations and real-time traffic data. The feature is available to all iX and i-series owners.",
        date_source_published: new Date().toISOString().split("T")[0],
      },
    ];
    return mockAlerts;
  }
}
