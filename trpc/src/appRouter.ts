import {publicProcedure, router} from './trpc.ts'
import {z} from 'zod'

type User = {
  name: string,
  age: number,
}

hi 

const userMap: Record<string, User> = {}
let nextId = 1;

export const appRouter = router({
  userById: publicProcedure
    .input(z.string())
    .query(async (opts) => {
      const {input: id} = opts;
      return userMap[id];
    }),
  createUser: publicProcedure
    .input(z.object({name: z.string(), age: z.number().int()}))
    .mutation(async (opts) => {
      const {input} = opts;
      userMap[str(nextId)] = input;
      nextId += 1;
    }),
  listUsers: publicProcedure
  .query(async () => userMap.values())
})

export type AppRouter = typeof appRouter;
