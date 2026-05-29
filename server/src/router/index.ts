import { router } from "../trpc";
import { signalsRouter } from "./signals";
import { healthRouter } from "./health";
import { analyticsRouter } from "./analytics";
import { authRouter } from "./auth";
import { configRouter } from "./config";
import { collectRouter } from "./collect";

export const appRouter = router({
  signals: signalsRouter,
  health: healthRouter,
  analytics: analyticsRouter,
  auth: authRouter,
  config: configRouter,
  collect: collectRouter,
});

export type AppRouter = typeof appRouter;
