import "dotenv/config";
import cron from "node-cron";
import { runImapIngestion, runScraperIngestion, runAppStoreIngestion } from "./jobs/ingest";
import { runAllHealthChecks } from "./jobs/healthChecks";
import { generateWeeklyAnalyticsReport } from "./jobs/analytics";

console.log("[Worker] Starting background job worker...");

// Hourly: check IMAP for new Google Alerts
cron.schedule("0 * * * *", async () => {
  console.log("[Worker] Running IMAP ingestion...");
  try {
    const count = await runImapIngestion();
    console.log(`[Worker] IMAP: ingested ${count} alerts`);
  } catch (err) {
    console.error("[Worker] IMAP ingestion failed:", err);
  }
});

// Every 6 hours: run health checks
cron.schedule("0 */6 * * *", async () => {
  console.log("[Worker] Running health checks...");
  try {
    await runAllHealthChecks();
  } catch (err) {
    console.error("[Worker] Health checks failed:", err);
  }
});

// Daily at 8 AM: scrape brand app pages
cron.schedule("0 8 * * *", async () => {
  console.log("[Worker] Running brand page scraping...");
  try {
    const count = await runScraperIngestion();
    console.log(`[Worker] Scraper: ingested ${count} signals`);
  } catch (err) {
    console.error("[Worker] Scraper failed:", err);
  }
});

// Daily at 9 AM: scrape app store pages
cron.schedule("0 9 * * *", async () => {
  console.log("[Worker] Running app store scraping...");
  try {
    const count = await runAppStoreIngestion();
    console.log(`[Worker] App store: ingested ${count} signals`);
  } catch (err) {
    console.error("[Worker] App store scraping failed:", err);
  }
});

// Friday at 5 PM: generate weekly analytics
cron.schedule("0 17 * * 5", async () => {
  console.log("[Worker] Generating weekly analytics report...");
  try {
    await generateWeeklyAnalyticsReport();
    console.log("[Worker] Weekly analytics report generated");
  } catch (err) {
    console.error("[Worker] Weekly analytics generation failed:", err);
  }
});

// Run initial health checks on startup
runAllHealthChecks().catch(console.error);

console.log("[Worker] All cron jobs scheduled");
