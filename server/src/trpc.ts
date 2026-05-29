import { initTRPC, TRPCError } from "@trpc/server";
import type { Request, Response } from "express";
export interface Context {
  req: Request & { session?: { userId?: string; userEmail?: string; userName?: string; userPicture?: string; destroy: (cb: () => void) => void } };
  res: Response;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.req.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next();
});
