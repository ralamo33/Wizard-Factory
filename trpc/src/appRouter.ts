import { listUsersPageSchema, listUsersQuerySchema, userSchema } from "@wizard/domain";
import { findUser, listUsers, saveUser } from "@wizard/service";
import { z } from "zod";

import { publicProcedure, router } from "./trpc.ts";

export const appRouter = router({
  userById: publicProcedure.input(z.string()).query((opts) => findUser(opts.input)),
  createUser: publicProcedure.input(userSchema).mutation((opts) => {
    saveUser(opts.input);
  }),
  listUsers: publicProcedure
    .input(listUsersQuerySchema)
    .output(listUsersPageSchema)
    .query((opts) => listUsers(opts.input)),
});

export type AppRouter = typeof appRouter;
