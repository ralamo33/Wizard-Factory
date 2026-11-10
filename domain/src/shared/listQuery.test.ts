import assert from "node:assert/strict";
import { test } from "node:test";

import { z } from "zod";

import {
  containsFilterSchema,
  dateRangeFilterSchema,
  equalsFilterSchema,
  listPageSchema,
  listQuerySchema,
  oneOfFilterSchema,
  rangeFilterSchema,
} from "./listQuery.ts";

const querySchema = listQuerySchema(
  z.enum(["name", "age"]),
  z
    .object({
      name: containsFilterSchema,
      title: equalsFilterSchema,
      age: rangeFilterSchema,
      joined: dateRangeFilterSchema,
      colour: oneOfFilterSchema(z.enum(["red", "blue"])),
    })
    .readonly(),
);

test("an empty query is the first unsorted, unfiltered page of 100", () => {
  assert.deepEqual(querySchema.parse({}), { page: 1, pageLimit: 100, filters: {} });
});

test("pageLimit may go up to 1000 but no further", () => {
  assert.equal(querySchema.safeParse({ pageLimit: 1000 }).success, true);
  assert.equal(querySchema.safeParse({ pageLimit: 1001 }).success, false);
});

test("page starts at 1", () => {
  assert.equal(querySchema.safeParse({ page: 0 }).success, false);
});

test("sortBy accepts only the sort keys and sortDirection only ascending or descending", () => {
  assert.equal(querySchema.safeParse({ sortBy: "age", sortDirection: "descending" }).success, true);
  assert.equal(querySchema.safeParse({ sortBy: "colour" }).success, false);
  assert.equal(querySchema.safeParse({ sortBy: "age", sortDirection: "up" }).success, false);
});

test("a contains filter is trimmed and must not be blank", () => {
  assert.deepEqual(querySchema.parse({ filters: { name: "  kal " } }).filters, { name: "kal" });
  assert.equal(querySchema.safeParse({ filters: { name: "   " } }).success, false);
});

test("an equals filter is trimmed and must not be blank", () => {
  assert.deepEqual(querySchema.parse({ filters: { title: " Highprince " } }).filters, { title: "Highprince" });
  assert.equal(querySchema.safeParse({ filters: { title: "" } }).success, false);
});

test("a range filter takes numeric bounds and a date range takes ISO dates", () => {
  assert.equal(querySchema.safeParse({ filters: { age: { min: 18 }, joined: { from: "2026-01-01", to: "2026-12-31" } } }).success, true);
  assert.equal(querySchema.safeParse({ filters: { age: { min: "18" } } }).success, false);
  assert.equal(querySchema.safeParse({ filters: { joined: { from: "January" } } }).success, false);
});

test("a oneOf filter needs at least one allowed value", () => {
  assert.equal(querySchema.safeParse({ filters: { colour: ["red"] } }).success, true);
  assert.equal(querySchema.safeParse({ filters: { colour: [] } }).success, false);
  assert.equal(querySchema.safeParse({ filters: { colour: ["green"] } }).success, false);
});

test("a list page holds its items and whether another page follows", () => {
  const pageSchema = listPageSchema(z.string());

  assert.deepEqual(pageSchema.parse({ items: ["a"], hasNextPage: false }), { items: ["a"], hasNextPage: false });
  assert.equal(pageSchema.safeParse({ items: ["a"], hasNextPage: false, total: 1 }).success, true);
  assert.equal(pageSchema.safeParse({ items: ["a"] }).success, false);
});
