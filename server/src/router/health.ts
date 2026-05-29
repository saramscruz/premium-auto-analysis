import { router, protectedProcedure } from "../trpc";
import { getDb, schema } from "../db";
import { runAllHealthChecks } from "../jobs/healthChecks";

export const healthRouter = router({
  status: protectedProcedure.query(async () => {
    const db = getDb();
    const checks = await db.select().from(schema.health_checks);

    const results = checks.map((c) => ({
      name: c.name,
      status: c.status as "ok" | "warn" | "error" | "unknown",
      message: c.message,
      last_checked: c.last_checked,
      metrics: (() => { try { return JSON.parse(c.metrics); } catch { return {}; } })(),
    }));

    const overallStatus = results.length === 0
      ? "unknown"
      : results.some((r) => r.status === "error")
        ? "error"
        : results.some((r) => r.status === "warn")
          ? "warn"
          : "ok";

    return { checks: results, overallStatus };
  }),

  runChecks: protectedProcedure.mutation(async () => {
    await runAllHealthChecks();
    return { success: true };
  }),
});
