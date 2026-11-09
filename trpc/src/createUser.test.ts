import assert from "node:assert/strict";
import { test } from "node:test";
import { Result } from "@praha/byethrow";
import { createUser } from "./createUser.ts";

await test("succeeds with the user when it is valid", () => {
  assert.deepEqual(createUser({ name: "Ryan", age: 27 }), Result.succeed({ name: "Ryan", age: 27 }));
});

await test("fails when the user is invalid", () => {
  assert.equal(Result.isFailure(createUser({ name: "", age: 27 })), true);
});
