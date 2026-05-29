import { getDb, schema } from "../db";
import { eq, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { generateWeeklyAnalytics } from "../integrations/claude";
import { sendWeeklyReport } from "../integrations/email";

export async function generateWeeklyAnalyticsReport(weekNumber?: number): Promise<void> {
  const db = getDb();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString().split("T")[0];

  const signals = await db
    .select()
    .from(schema.signals)
    .where(eq(schema.signals.status, "approved"));

  const thisWeekSignals = signals.filter((s) => s.date_collected >= since);

  const bySource: Record<string, number> = {};
  const byBrand: Record<string, number> = {};
  const byElement: Record<string, number> = {};

  for (const s of thisWeekSignals) {
    bySource[s.source_type] = (bySource[s.source_type] || 0) + 1;
    byBrand[s.brand] = (byBrand[s.brand] || 0) + 1;

    try {
      const elements = JSON.parse(s.ownership_narrative_elements || "[]") as string[];
      for (const el of elements) {
        byElement[el] = (byElement[el] || 0) + 1;
      }
    } catch {}
  }

  const duplicates = thisWeekSignals.filter((s) => s.is_duplicate).length;
  const duplicateRate = thisWeekSignals.length > 0 ? duplicates / thisWeekSignals.length : 0;

  let patterns: string[] = [];
  let contentAngles: string[] = [];

  try {
    if (process.env.ANTHROPIC_API_KEY && thisWeekSignals.length > 0) {
      const result = await generateWeeklyAnalytics(
        thisWeekSignals.map((s) => ({
          brand: s.brand,
          source_type: s.source_type,
          signal_type: s.signal_type,
          ownership_narrative_elements: s.ownership_narrative_elements,
          signal_summary: s.signal_summary,
        }))
      );
      patterns = result.patterns;
      contentAngles = result.content_angles;
    }
  } catch (err) {
    console.error("[Analytics] Claude analytics generation failed:", err);
  }

  const wk = weekNumber || Math.ceil((Date.now() - new Date("2026-05-22").getTime()) / (7 * 24 * 3600 * 1000));

  await db.insert(schema.analytics).values({
    id: uuidv4(),
    week: wk,
    signal_count: thisWeekSignals.length,
    by_source: JSON.stringify(bySource),
    by_brand: JSON.stringify(byBrand),
    by_ownership_element: JSON.stringify(byElement),
    patterns_detected: JSON.stringify(patterns),
    duplicate_rate: duplicateRate,
    content_angle_suggestions: JSON.stringify(contentAngles),
  }).onConflictDoNothing();

  const config = await db.select().from(schema.user_config).limit(1);
  const cfg = config[0];

  if (cfg?.email_alerts_address) {
    const reportHtml = buildWeeklyReportHtml(wk, thisWeekSignals.length, bySource, byBrand, byElement, patterns, contentAngles, duplicateRate);
    await sendWeeklyReport(cfg.email_alerts_address, wk, reportHtml);
  }

  console.log(`[Analytics] Week ${wk} report generated: ${thisWeekSignals.length} signals`);
}

function buildWeeklyReportHtml(
  week: number,
  total: number,
  bySource: Record<string, number>,
  byBrand: Record<string, number>,
  byElement: Record<string, number>,
  patterns: string[],
  angles: string[],
  dupRate: number
): string {
  return `
<html><body style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 20px;">
<h2>Premium Auto Analysis — Week ${week} Summary</h2>
<hr/>
<h3>📊 WEEKLY SNAPSHOT</h3>
<p>Total Signals: <strong>${total}</strong><br/>
Duplicate Rate: ${(dupRate * 100).toFixed(1)}%</p>
<h3>📍 BY SOURCE</h3>
<ul>${Object.entries(bySource).map(([k, v]) => `<li>${k}: ${v}</li>`).join("")}</ul>
<h3>🏎️ BY BRAND</h3>
<ul>${Object.entries(byBrand).map(([k, v]) => `<li>${k}: ${v}</li>`).join("")}</ul>
<h3>🎯 BY NARRATIVE ELEMENT</h3>
<ul>${Object.entries(byElement).map(([k, v]) => `<li>${k}: ${v}</li>`).join("")}</ul>
${patterns.length ? `<h3>🔍 PATTERNS</h3><ul>${patterns.map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
${angles.length ? `<h3>💡 CONTENT ANGLES</h3><ul>${angles.map((a) => `<li>${a}</li>`).join("")}</ul>` : ""}
<hr/><p style="color: #666; font-size: 12px;">Premium Auto Analysis Automation — Week ${week}</p>
</body></html>`;
}
