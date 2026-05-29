import { router, protectedProcedure } from "../trpc";
import { runImapIngestion, runScraperIngestion, runAppStoreIngestion } from "../jobs/ingest";

export const collectRouter = router({
  triggerImap: protectedProcedure.mutation(async () => {
    const count = await runImapIngestion();
    return { success: true, ingested: count };
  }),

  triggerScrape: protectedProcedure.mutation(async () => {
    const count = await runScraperIngestion();
    return { success: true, ingested: count };
  }),

  triggerAppStore: protectedProcedure.mutation(async () => {
    const count = await runAppStoreIngestion();
    return { success: true, ingested: count };
  }),
});
