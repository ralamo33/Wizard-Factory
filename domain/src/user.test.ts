import assert from "node:assert/strict";
import { test } from "node:test";
import { Result } from "@praha/byethrow";
import { createUser } from "./user.ts";

await test("creates a user from a name and a whole-number age", () => {
  assert.deepEqual(createUser({ name: "Ryan", age: 27 }), Result.succeed({ name: "Ryan", age: 27 }));
});

await test("rejects a blank name", () => {
  assert.deepEqual(createUser({ name: "  ", age: 27 }), Result.fail({ type: "EmptyName" }));
});

await test("rejects a negative age", () => {
  assert.deepEqual(createUser({ name: "Ryan", age: -1 }), Result.fail({ type: "InvalidAge", age: -1 }));
});

await test("rejects a fractional age", () => {
  assert.deepEqual(createUser({ name: "Ryan", age: 2.5 }), Result.fail({ type: "InvalidAge", age: 2.5 }));
});
