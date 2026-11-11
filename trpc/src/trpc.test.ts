import assert from "node:assert/strict";
import { test } from "node:test";

import type { Viewer } from "@wizard/domain";

import { appRouter } from "./appRouter.ts";
import { createCallerFactory, permissionProcedure, protectedProcedure, publicProcedure, router } from "./trpc.ts";

const manager: Viewer = { userId: "user_manager", permissions: ["users:manage"] };
const knight: Viewer = { userId: "user_knight", permissions: [] };

const gated = createCallerFactory(
  router({
    open: publicProcedure.query(() => "open"),
    whoAmI: protectedProcedure.query(({ ctx }) => ctx.viewer.userId),
    manage: permissionProcedure("users:manage").query(({ ctx }) => ctx.viewer.userId),
  }),
);

test("a public procedure lets anyone through", async () => {
  assert.equal(await gated({ viewer: undefined }).open(), "open");
});

test("a protected procedure refuses a caller without a viewer", async () => {
  await assert.rejects(gated({ viewer: undefined }).whoAmI(), { code: "UNAUTHORIZED" });
  assert.equal(await gated({ viewer: knight }).whoAmI(), "user_knight");
});

test("a permission procedure refuses a viewer without the permission", async () => {
  await assert.rejects(gated({ viewer: undefined }).manage(), { code: "UNAUTHORIZED" });
  await assert.rejects(gated({ viewer: knight }).manage(), { code: "FORBIDDEN" });
  assert.equal(await gated({ viewer: manager }).manage(), "user_manager");
});

test("user procedures need a signed-in viewer", async () => {
  const caller = createCallerFactory(appRouter)({ viewer: undefined });

  await assert.rejects(caller.listUsers({}), { code: "UNAUTHORIZED" });
  await assert.rejects(caller.userById("1"), { code: "UNAUTHORIZED" });
  await assert.rejects(caller.createUser({ name: "Kaladin", age: 20 }), { code: "UNAUTHORIZED" });
});
