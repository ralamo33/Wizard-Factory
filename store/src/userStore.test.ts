import assert from "node:assert/strict";
import { test } from "node:test";
import { findUser, listUsers, saveUser } from "./userStore.ts";

await test("lists saved users and finds them by id", () => {
  saveUser({ name: "Ryan", age: 27 });
  saveUser({ name: "Karen", age: 27 });
  assert.deepEqual(listUsers(), [
    { name: "Ryan", age: 27 },
    { name: "Karen", age: 27 },
  ]);
  assert.deepEqual(findUser("2"), { name: "Karen", age: 27 });
});
