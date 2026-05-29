import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getDb, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import { generateWeeklyAnalyticsReport } from "../jobs/analytics";

export const analyticsRouter = router({
  weekly: protectedProcedure.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.analytics)
      .orderBy(desc(schema.analytics.week))
      .limit(4);

    return rows.map((r) => ({
      ...r,
      by_source: JSON.parse(r.by_source),
      by_brand: JSON.parse(r.by_brand),
      by_ownership_element: JSON.parse(r.by_ownership_element),
      patterns_detected: JSON.parse(r.patterns_detected),
      content_angle_suggestions: JSON.parse(r.content_angle_suggestions),
    }));
  }),

  overview: protectedProcedure.query(async () => {
    const db = getDb();
    const allSignals = await db.select().from(schema.signals);
    const approved = allSignals.filter((s) => s.status === "approved");

    const byBrand: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byElement: Record<string, number> = {};

    for (const s of approved) {
      byBrand[s.brand] = (byBrand[s.brand] || 0) + 1;
      bySource[s.source_type] = (bySource[s.source_type] || 0) + 1;
      try {
        const els = JSON.parse(s.ownership_narrative_elements || "[]") as string[];
        for (const el of els) byElement[el] = (byElement[el] || 0) + 1;
      } catch {}
    }

    return {
      total: approved.length,
      target: 120,
      byBrand,
      bySource,
      byElement,
      pending: allSignals.filter((s) => s.status === "pending").length,
      duplicates: allSignals.filter((s) => s.is_duplicate).length,
    };
  }),

  generate: protectedProcedure.mutation(async () => {
    await generateWeeklyAnalyticsReport();
    return { success: true };
  }),
});
