import assert from "node:assert/strict";
import { test } from "node:test";

import { clerkUserIdSchema, permissionSchema, viewerSchema } from "./viewer.ts";

test("a Clerk user id starts with user_", () => {
  assert.equal(clerkUserIdSchema.safeParse("user_2abc").success, true);
  assert.equal(clerkUserIdSchema.safeParse("3f6c1a52-0000-4000-8000-000000000000").success, false);
});

test("a rejected Clerk user id explains itself to the person", () => {
  const result = clerkUserIdSchema.safeParse("org_2abc");

  assert.equal(result.success ? undefined : result.error.issues[0]?.message, "Sign in again to continue.");
});

test("a viewer holds a Clerk user id and its permissions", () => {
  assert.deepEqual(viewerSchema.parse({ userId: "user_2abc", permissions: ["users:manage"] }), {
    userId: "user_2abc",
    permissions: ["users:manage"],
  });
  assert.deepEqual(viewerSchema.parse({ userId: "user_2abc", permissions: [] }).permissions, []);
});

test("a viewer rejects unknown permissions and missing ids", () => {
  assert.equal(viewerSchema.safeParse({ userId: "user_2abc", permissions: ["godmode"] }).success, false);
  assert.equal(viewerSchema.safeParse({ permissions: [] }).success, false);
  assert.equal(permissionSchema.safeParse("users:manage").success, true);
});
