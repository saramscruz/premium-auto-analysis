import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";
import { initializeSheetHeaders, testSheetsConnection, mockTestSheetsConnection } from "../integrations/sheets";

const USE_MOCK = process.env.USE_MOCK_INTEGRATIONS === "true";

export const configRouter = router({
  get: protectedProcedure.query(async () => {
    const db = getDb();
    const rows = await db.select().from(schema.user_config).limit(1);
    const cfg = rows[0];
    if (!cfg) return null;
    return {
      google_sheets_id: cfg.google_sheets_id,
      email_alerts_address: cfg.email_alerts_address,
      imap_host: cfg.imap_host,
      imap_port: cfg.imap_port,
      imap_user: cfg.imap_user,
      brands_to_monitor: (() => {
        try { return JSON.parse(cfg.brands_to_monitor); } catch { return []; }
      })(),
    };
  }),

  update: protectedProcedure
    .input(z.object({
      google_sheets_id: z.string().optional(),
      email_alerts_address: z.string().email().optional(),
      imap_host: z.string().optional(),
      imap_port: z.number().optional(),
      imap_user: z.string().optional(),
      imap_password: z.string().optional(),
      brands_to_monitor: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (input.google_sheets_id !== undefined) update.google_sheets_id = input.google_sheets_id;
      if (input.email_alerts_address !== undefined) update.email_alerts_address = input.email_alerts_address;
      if (input.imap_host !== undefined) update.imap_host = input.imap_host;
      if (input.imap_port !== undefined) update.imap_port = input.imap_port;
      if (input.imap_user !== undefined) update.imap_user = input.imap_user;
      if (input.imap_password !== undefined) update.imap_password = input.imap_password;
      if (input.brands_to_monitor !== undefined) update.brands_to_monitor = JSON.stringify(input.brands_to_monitor);

      await db.update(schema.user_config).set(update as any).where(eq(schema.user_config.id, 1));
      return { success: true };
    }),

  testSheets: protectedProcedure
    .input(z.object({ sheetsId: z.string() }))
    .mutation(async ({ input }) => {
      const ok = USE_MOCK
        ? await mockTestSheetsConnection(input.sheetsId)
        : await testSheetsConnection(input.sheetsId);
      return { ok };
    }),

  initSheets: protectedProcedure
    .input(z.object({ sheetsId: z.string() }))
    .mutation(async ({ input }) => {
      if (USE_MOCK) return { success: true };
      await initializeSheetHeaders(input.sheetsId);
      return { success: true };
    }),
});
