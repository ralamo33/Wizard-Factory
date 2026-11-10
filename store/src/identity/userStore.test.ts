import assert from "node:assert/strict";
import { test } from "node:test";

import { findUser, listUsers, saveUser } from "./userStore.ts";

const firstPage = { page: 1, pageLimit: 100, filters: {} } as const;

test("saved users get a stable id and the date they were sworn", () => {
  saveUser({ name: "Store Kaladin", age: 20, order: "Windrunners" });

  const [kaladin] = listUsers({ ...firstPage, filters: { name: "Store Kaladin" } }).items;

  assert.ok(kaladin !== undefined);
  assert.match(kaladin.swornOn, /^\d{4}-\d{2}-\d{2}T/u);
  assert.deepEqual(findUser(kaladin.id), kaladin);
});

test("listUsers filters, sorts and pages the stored users", () => {
  saveUser({ name: "Store Shallan", age: 17, order: "Lightweavers" });
  saveUser({ name: "Store Dalinar", age: 53, order: "Bondsmiths" });
  saveUser({ name: "Store Lift", age: 13 });

  const page = listUsers({ page: 1, pageLimit: 2, sortBy: "age", sortDirection: "descending", filters: { name: "store", age: { max: 30 } } });

  assert.deepEqual(
    page.items.map((user) => user.name),
    ["Store Kaladin", "Store Shallan"],
  );
  assert.equal(page.hasNextPage, true);
  assert.deepEqual(
    listUsers({ ...firstPage, filters: { order: ["Bondsmiths", "Lightweavers"], name: "store" } }).items.map((user) => user.name),
    ["Store Shallan", "Store Dalinar"],
  );
});
