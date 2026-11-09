import {z} from 'zod'
import {publicProcedure, router} from './trpc.ts'

interface User {
  name: string,
  age: number,
}


const userMap = new Map<string, User>()

export const appRouter = router({
  userById: publicProcedure
    .input(z.string())
    .query((opts) => {
      const {input: id} = opts;
      return userMap.get(id);
    }),
  createUser: publicProcedure
    .input(z.object({name: z.string(), age: z.number().int()}))
    .mutation((opts) => {
      const {input} = opts;
      userMap.set(String(userMap.size + 1), input);
    }),
  listUsers: publicProcedure
  .query(() => [...userMap.values()])
})

export type AppRouter = typeof appRouter;
