import { listUsersPageSchema, listUsersQuerySchema, userSchema } from "@wizard/domain";
import { findUser, listUsers, saveUser } from "@wizard/service";
import { z } from "zod";

import { orInternalError } from "./orInternalError.ts";
import { protectedProcedure, router } from "./trpc.ts";

export const appRouter = router({
  userById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => orInternalError(await findUser(ctx.viewer, input))),
  createUser: protectedProcedure.input(userSchema).mutation(async ({ ctx, input }) => orInternalError(await saveUser(ctx.viewer, input))),
  listUsers: protectedProcedure
    .input(listUsersQuerySchema)
    .output(listUsersPageSchema)
    .query(async ({ ctx, input }) => orInternalError(await listUsers(ctx.viewer, input))),
});

export type AppRouter = typeof appRouter;
