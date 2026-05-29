import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.req.session?.userId) return null;
    return {
      userId: ctx.req.session.userId,
      email: ctx.req.session.userEmail,
      name: ctx.req.session.userName,
      picture: ctx.req.session.userPicture,
    };
  }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    ctx.req.session?.destroy(() => {});
    return { success: true };
  }),
});
