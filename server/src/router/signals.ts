import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getDb, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { generateAiSuggestion, mockGenerateAiSuggestion } from "../integrations/claude";
import { appendSignalToSheet, mockAppendSignalToSheet } from "../integrations/sheets";
import { checkDuplicate } from "../integrations/dedup";
import { ApproveSignalInputSchema } from "../../../shared/schemas";

const USE_MOCK = process.env.USE_MOCK_INTEGRATIONS === "true";

export const signalsRouter = router({
  pending: protectedProcedure.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.signals)
      .where(eq(schema.signals.status, "pending"))
      .orderBy(desc(schema.signals.created_at));

    return rows.map(deserializeSignal);
  }),

  all: protectedProcedure.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.signals)
      .orderBy(desc(schema.signals.created_at));
    return rows.map(deserializeSignal);
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.signals)
        .where(eq(schema.signals.id, input.id))
        .limit(1);

      if (!rows[0]) throw new Error("Signal not found");
      return deserializeSignal(rows[0]);
    }),

  getSuggestion: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.signals)
        .where(eq(schema.signals.id, input.id))
        .limit(1);

      const signal = rows[0];
      if (!signal) throw new Error("Signal not found");

      if (signal.ai_suggestion) {
        return JSON.parse(signal.ai_suggestion);
      }

      const suggestion = USE_MOCK
        ? mockGenerateAiSuggestion(
            signal.brand,
            signal.source_type,
            signal.exact_excerpt,
            signal.url,
            signal.headline
          )
        : await generateAiSuggestion(
            signal.brand,
            signal.source_type,
            signal.exact_excerpt,
            signal.url,
            signal.headline
          );

      await db
        .update(schema.signals)
        .set({ ai_suggestion: JSON.stringify(suggestion), updated_at: new Date().toISOString() })
        .where(eq(schema.signals.id, input.id));

      return suggestion;
    }),

  checkDuplicate: protectedProcedure
    .input(z.object({ excerpt: z.string(), brand: z.string(), excludeId: z.string().optional() }))
    .query(async ({ input }) => {
      return checkDuplicate(input.excerpt, input.brand, input.excludeId);
    }),

  approve: protectedProcedure
    .input(ApproveSignalInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const rows = await db
        .select()
        .from(schema.signals)
        .where(eq(schema.signals.id, input.id))
        .limit(1);

      const signal = rows[0];
      if (!signal) throw new Error("Signal not found");

      const config = await db.select().from(schema.user_config).limit(1);
      const cfg = config[0];

      const updatedSignal = {
        ...signal,
        ...input,
        ownership_narrative_elements: JSON.stringify(input.ownership_narrative_elements),
        status: "approved" as const,
        updated_at: new Date().toISOString(),
      };

      await db
        .update(schema.signals)
        .set({
          status: "approved",
          signal_summary: input.signal_summary,
          signal_type: input.signal_type,
          ownership_narrative_elements: JSON.stringify(input.ownership_narrative_elements),
          product_design_choice: input.product_design_choice,
          confidence_level: input.confidence_level,
          limitation: input.limitation,
          possible_post_angle: input.possible_post_angle,
          notes: input.notes || null,
          exact_excerpt: input.exact_excerpt,
          updated_at: new Date().toISOString(),
        })
        .where(eq(schema.signals.id, input.id));

      let sheetsRow: number | null = null;
      if (cfg?.google_sheets_id) {
        try {
              const fullSignal = deserializeSignal({ ...signal, ...updatedSignal } as typeof signal);
          sheetsRow = USE_MOCK
            ? await mockAppendSignalToSheet(cfg.google_sheets_id, fullSignal as any)
            : await appendSignalToSheet(cfg.google_sheets_id, fullSignal as any);

          if (sheetsRow) {
            await db
              .update(schema.signals)
              .set({ synced_to_sheets: true, sheets_row_number: sheetsRow })
              .where(eq(schema.signals.id, input.id));
          }
        } catch (err) {
          console.error("[Sheets] Sync failed:", err);
        }
      }

      return { success: true, sheetsRow };
    }),

  skip: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(schema.signals)
        .set({ status: "skipped", updated_at: new Date().toISOString() })
        .where(eq(schema.signals.id, input.id));
      return { success: true };
    }),

  markDuplicate: protectedProcedure
    .input(z.object({ id: z.string(), duplicateOfId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(schema.signals)
        .set({
          status: "duplicate",
          is_duplicate: true,
          duplicate_of_signal_id: input.duplicateOfId || null,
          updated_at: new Date().toISOString(),
        })
        .where(eq(schema.signals.id, input.id));
      return { success: true };
    }),
});

function deserializeSignal(row: typeof schema.signals.$inferSelect) {
  let elements: string[] = [];
  try { elements = JSON.parse(row.ownership_narrative_elements || "[]"); } catch {}

  let aiSuggestion = null;
  try { if (row.ai_suggestion) aiSuggestion = JSON.parse(row.ai_suggestion); } catch {}

  return {
    ...row,
    ownership_narrative_elements: elements,
    ai_suggestion: aiSuggestion,
    is_duplicate: Boolean(row.is_duplicate),
    synced_to_sheets: Boolean(row.synced_to_sheets),
  };
}
