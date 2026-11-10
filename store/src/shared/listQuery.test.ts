import assert from "node:assert/strict";
import { test } from "node:test";

import { applyListQuery, contains, equals, inDateRange, inRange, type ListQuery, type ListSpec, oneOf } from "./listQuery.ts";

type Knight = Readonly<{ name: string; age: number; title: string; order: "wind" | "bond" | undefined; joined: string }>;

type KnightFilters = Readonly<{
  name?: string | undefined;
  title?: string | undefined;
  age?: Readonly<{ min?: number | undefined; max?: number | undefined }> | undefined;
  order?: readonly ("wind" | "bond")[] | undefined;
  joined?: Readonly<{ from?: string | undefined; to?: string | undefined }> | undefined;
}>;

const knights: readonly Knight[] = [
  { name: "Kaladin", age: 20, title: "Captain", order: "wind", joined: "2026-03-01T09:00:00.000Z" },
  { name: "Dalinar", age: 53, title: "Highprince", order: "bond", joined: "2026-01-15T23:59:00.000Z" },
  { name: "Adolin", age: 23, title: "Highprince", order: undefined, joined: "2026-02-10T12:00:00.000Z" },
  { name: "Teft", age: 40, title: "Sergeant", order: "wind", joined: "2026-03-02T00:00:00.000Z" },
];

const spec: ListSpec<Knight, "name" | "age", KnightFilters> = {
  sort: { name: (knight) => knight.name, age: (knight) => knight.age },
  filters: {
    name: contains((knight: Knight) => knight.name),
    title: equals((knight: Knight) => knight.title),
    age: inRange((knight: Knight) => knight.age),
    order: oneOf((knight: Knight) => knight.order),
    joined: inDateRange((knight: Knight) => knight.joined),
  },
};

const query = (overrides: Partial<ListQuery<"name" | "age", KnightFilters>>): ListQuery<"name" | "age", KnightFilters> => ({
  page: 1,
  pageLimit: 100,
  filters: {},
  ...overrides,
});

const names = (overrides: Partial<ListQuery<"name" | "age", KnightFilters>>): readonly string[] =>
  applyListQuery(knights, spec, query(overrides)).items.map((knight) => knight.name);

test("without sortBy rows keep their insertion order", () => {
  assert.deepEqual(names({}), ["Kaladin", "Dalinar", "Adolin", "Teft"]);
});

test("sortBy sorts strings and numbers, ascending by default", () => {
  assert.deepEqual(names({ sortBy: "name" }), ["Adolin", "Dalinar", "Kaladin", "Teft"]);
  assert.deepEqual(names({ sortBy: "age", sortDirection: "ascending" }), ["Kaladin", "Adolin", "Teft", "Dalinar"]);
  assert.deepEqual(names({ sortBy: "age", sortDirection: "descending" }), ["Dalinar", "Teft", "Adolin", "Kaladin"]);
});

test("contains matches a substring regardless of case", () => {
  assert.deepEqual(names({ filters: { name: "LIN" } }), ["Dalinar", "Adolin"]);
});

test("equals matches the whole value only", () => {
  assert.deepEqual(names({ filters: { title: "Highprince" } }), ["Dalinar", "Adolin"]);
  assert.deepEqual(names({ filters: { title: "High" } }), []);
});

test("inRange includes both bounds and leaves a missing bound open", () => {
  assert.deepEqual(names({ filters: { age: { min: 23, max: 40 } } }), ["Adolin", "Teft"]);
  assert.deepEqual(names({ filters: { age: { min: 40 } } }), ["Dalinar", "Teft"]);
  assert.deepEqual(names({ filters: { age: { max: 20 } } }), ["Kaladin"]);
});

test("inDateRange compares whole days and includes both ends", () => {
  assert.deepEqual(names({ filters: { joined: { from: "2026-01-15", to: "2026-03-01" } } }), ["Kaladin", "Dalinar", "Adolin"]);
  assert.deepEqual(names({ filters: { joined: { from: "2026-03-02" } } }), ["Teft"]);
});

test("oneOf keeps rows whose value is listed and drops rows without a value", () => {
  assert.deepEqual(names({ filters: { order: ["wind"] } }), ["Kaladin", "Teft"]);
  assert.deepEqual(names({ filters: { order: ["wind", "bond"] } }), ["Kaladin", "Dalinar", "Teft"]);
});

test("filters combine and apply before sorting and paging", () => {
  assert.deepEqual(names({ filters: { order: ["wind", "bond"], age: { max: 45 } }, sortBy: "age", sortDirection: "descending" }), [
    "Teft",
    "Kaladin",
  ]);
});

test("pages hold at most pageLimit rows and report whether another page follows", () => {
  assert.deepEqual(applyListQuery(knights, spec, query({ pageLimit: 3 })), { items: knights.slice(0, 3), hasNextPage: true });
  assert.deepEqual(applyListQuery(knights, spec, query({ pageLimit: 3, page: 2 })), { items: knights.slice(3), hasNextPage: false });
  assert.deepEqual(applyListQuery(knights, spec, query({ pageLimit: 2, page: 2 })), { items: knights.slice(2), hasNextPage: false });
  assert.deepEqual(applyListQuery(knights, spec, query({ page: 3, pageLimit: 2 })), { items: [], hasNextPage: false });
});
