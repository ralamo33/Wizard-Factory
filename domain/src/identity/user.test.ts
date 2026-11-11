import assert from "node:assert/strict";
import { test } from "node:test";

import { storedUserSchema, userSchema } from "./user.ts";

const stored = { name: "Kaladin", age: 20, id: "1", swornOn: "2026-03-01T09:00:00.000Z" };

test("a stored user carries its owner's Clerk user id", () => {
  assert.equal(storedUserSchema.safeParse({ ...stored, userId: "user_2abc" }).success, true);
  assert.equal(storedUserSchema.safeParse(stored).success, false);
  assert.equal(storedUserSchema.safeParse({ ...stored, userId: "2abc" }).success, false);
});

test("user input never carries a user id", () => {
  assert.deepEqual(userSchema.parse({ name: "Kaladin", age: 20, userId: "user_2abc" }), { name: "Kaladin", age: 20 });
});
