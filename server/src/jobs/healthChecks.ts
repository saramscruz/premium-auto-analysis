import { getDb, schema, waitForMigrations } from "../db";
import { eq } from "drizzle-orm";
import { testSheetsConnection, mockTestSheetsConnection } from "../integrations/sheets";

const USE_MOCK = process.env.USE_MOCK_INTEGRATIONS === "true";

export interface CheckResult {
  status: "ok" | "warn" | "error" | "unknown";
  message: string;
  metrics?: Record<string, unknown>;
}

async function upsertCheck(name: string, result: CheckResult): Promise<void> {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.health_checks)
    .where(eq(schema.health_checks.name, name))
    .limit(1);

  const row = {
    name,
    status: result.status,
    message: result.message,
    last_checked: new Date().toISOString(),
    metrics: JSON.stringify(result.metrics || {}),
  };

  if (existing.length > 0) {
    await db.update(schema.health_checks).set(row).where(eq(schema.health_checks.name, name));
  } else {
    await db.insert(schema.health_checks).values(row);
  }
}

export async function checkImapConnectivity(): Promise<void> {
  const db = getDb();
  const config = await db.select().from(schema.user_config).limit(1);
  const cfg = config[0];

  if (!cfg?.imap_host || !cfg?.imap_user || !cfg?.imap_password) {
    await upsertCheck("imap_connectivity", {
      status: "warn",
      message: "IMAP not configured",
    });
    return;
  }

  if (USE_MOCK) {
    await upsertCheck("imap_connectivity", { status: "ok", message: "IMAP connected (mock)" });
    return;
  }

  try {
    const { ImapFlow } = await import("imapflow");
    const client = new ImapFlow({
      host: cfg.imap_host,
      port: cfg.imap_port || 993,
      secure: (cfg.imap_port || 993) === 993,
      auth: { user: cfg.imap_user, pass: cfg.imap_password },
      logger: false,
    });
    await client.connect();
    await client.logout();
    await upsertCheck("imap_connectivity", { status: "ok", message: "IMAP connected successfully" });
  } catch (err) {
    await upsertCheck("imap_connectivity", {
      status: "error",
      message: `IMAP connection failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export async function checkSheetsConnectivity(): Promise<void> {
  const db = getDb();
  const config = await db.select().from(schema.user_config).limit(1);
  const sheetsId = config[0]?.google_sheets_id;

  if (!sheetsId) {
    await upsertCheck("sheets_connectivity", {
      status: "warn",
      message: "Google Sheets ID not configured",
    });
    return;
  }

  try {
    const ok = USE_MOCK
      ? await mockTestSheetsConnection(sheetsId)
      : await testSheetsConnection(sheetsId);

    await upsertCheck("sheets_connectivity", {
      status: ok ? "ok" : "error",
      message: ok ? "Google Sheets connected" : "Google Sheets connection failed",
    });
  } catch (err) {
    await upsertCheck("sheets_connectivity", {
      status: "error",
      message: `Sheets error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export async function checkClaudeConnectivity(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    await upsertCheck("claude_api", { status: "warn", message: "Claude API key not configured" });
    return;
  }

  if (USE_MOCK) {
    await upsertCheck("claude_api", { status: "ok", message: "Claude API available (mock)" });
    return;
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "ping" }],
    });
    await upsertCheck("claude_api", { status: "ok", message: "Claude API reachable" });
  } catch (err) {
    await upsertCheck("claude_api", {
      status: "error",
      message: `Claude API error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export async function checkDatabaseHealth(): Promise<void> {
  try {
    const db = getDb();
    const result = await db.select().from(schema.signals).limit(1);
    const count = await db.select().from(schema.signals);

    await upsertCheck("database", {
      status: "ok",
      message: "Database healthy",
      metrics: { total_signals: count.length },
    });
  } catch (err) {
    await upsertCheck("database", {
      status: "error",
      message: `Database error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export async function checkLastScraperRun(): Promise<void> {
  try {
    const db = getDb();
    const latest = await db
      .select()
      .from(schema.scraper_cache)
      .orderBy(schema.scraper_cache.scraped_at)
      .limit(1);

    if (!latest[0]) {
      await upsertCheck("scraper_health", {
        status: "warn",
        message: "No scraper runs recorded yet",
      });
      return;
    }

    const lastRun = new Date(latest[0].scraped_at);
    const hoursSince = (Date.now() - lastRun.getTime()) / 1000 / 3600;

    await upsertCheck("scraper_health", {
      status: hoursSince < 48 ? "ok" : "warn",
      message:
        hoursSince < 48
          ? `Last scrape: ${Math.round(hoursSince)}h ago`
          : `Scraper may be stale: ${Math.round(hoursSince)}h since last run`,
      metrics: { hours_since_last_run: Math.round(hoursSince) },
    });
  } catch (err) {
    await upsertCheck("scraper_health", {
      status: "error",
      message: `Scraper health check error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export async function runAllHealthChecks(): Promise<void> {
  console.log("[Health] Running all health checks...");
  await waitForMigrations();
  await Promise.allSettled([
    checkImapConnectivity(),
    checkSheetsConnectivity(),
    checkClaudeConnectivity(),
    checkDatabaseHealth(),
    checkLastScraperRun(),
  ]);
  console.log("[Health] Health checks complete");
}
