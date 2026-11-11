import { initTRPC, TRPCError } from "@trpc/server";
import type { Permission } from "@wizard/domain";

import type { Context } from "./context.ts";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) =>
  ctx.viewer === undefined ? Promise.reject(new TRPCError({ code: "UNAUTHORIZED" })) : next({ ctx: { viewer: ctx.viewer } }),
);

export const permissionProcedure = (permission: Permission): typeof protectedProcedure =>
  protectedProcedure.use(async ({ ctx, next }) =>
    ctx.viewer.permissions.includes(permission) ? next() : Promise.reject(new TRPCError({ code: "FORBIDDEN" })),
  );
