import {findUser, listUsers, saveUser} from '@wizard/store'
import {z} from 'zod'
import {publicProcedure, router} from './trpc.ts'

export const appRouter = router({
  userById: publicProcedure
    .input(z.string())
    .query((opts) => findUser(opts.input)),
  createUser: publicProcedure
    .input(z.object({name: z.string(), age: z.number().int()}))
    .mutation((opts) => {
      saveUser(opts.input);
    }),
  listUsers: publicProcedure
  .query(() => listUsers())
})

export type AppRouter = typeof appRouter;
