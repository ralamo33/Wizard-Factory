import assert from "node:assert/strict";
import { test } from "node:test";
import { userSchema } from "./user.ts";

await test("accepts a name and a whole-number age", () => {
  assert.equal(userSchema.safeParse({ name: "Ryan", age: 27 }).success, true);
});

await test("rejects a blank name", () => {
  assert.equal(userSchema.safeParse({ name: "  ", age: 27 }).success, false);
});

await test("rejects a negative age", () => {
  assert.equal(userSchema.safeParse({ name: "Ryan", age: -1 }).success, false);
});

await test("rejects a fractional age", () => {
  assert.equal(userSchema.safeParse({ name: "Ryan", age: 2.5 }).success, false);
});

await test("keeps the name untrimmed", () => {
  assert.deepEqual(userSchema.parse({ name: " Ryan ", age: 27 }), { name: " Ryan ", age: 27 });
});
