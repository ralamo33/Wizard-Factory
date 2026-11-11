import assert from "node:assert/strict";
import { after, test } from "node:test";

import { Result } from "@praha/byethrow";
import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { asSystem, drizzleOf } from "./db.ts";
import { closeDb, withRollback } from "./dbTestOnly.ts";
import { applyListQuery, contains, equals, inDateRange, inRange, type ListQuery, type ListSpec, oneOf } from "./listQuery.ts";

const knightTable = pgTable("list_query_knights", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  age: integer().notNull(),
  title: text().notNull(),
  order: text({ enum: ["wind", "bond"] }),
  joined: timestamp({ withTimezone: true, mode: "date" }).notNull(),
});

type KnightFilters = Readonly<{
  name?: string | undefined;
  title?: string | undefined;
  age?: Readonly<{ min?: number | undefined; max?: number | undefined }> | undefined;
  order?: readonly ("wind" | "bond")[] | undefined;
  joined?: Readonly<{ from?: string | undefined; to?: string | undefined }> | undefined;
}>;

const knights = [
  { name: "Kaladin", age: 20, title: "Captain", order: "wind", joined: new Date("2026-03-01T09:00:00.000Z") },
  { name: "Dalinar", age: 53, title: "Highprince", order: "bond", joined: new Date("2026-01-15T23:59:00.000Z") },
  { name: "Adolin", age: 23, title: "Highprince", joined: new Date("2026-02-10T12:00:00.000Z") },
  { name: "Teft", age: 40, title: "Sergeant", order: "wind", joined: new Date("2026-03-02T00:00:00.000Z") },
] as const;

const spec: ListSpec<"name" | "age", KnightFilters> = {
  sort: { name: knightTable.name, age: knightTable.age },
  filters: {
    name: contains(knightTable.name),
    title: equals(knightTable.title),
    age: inRange(knightTable.age),
    order: oneOf(knightTable.order),
    joined: inDateRange(knightTable.joined),
  },
};

const query = (overrides: Partial<ListQuery<"name" | "age", KnightFilters>>): ListQuery<"name" | "age", KnightFilters> => ({
  page: 1,
  pageLimit: 100,
  filters: {},
  ...overrides,
});

const seedKnights = async (): Promise<void> => {
  Result.unwrap(
    await asSystem(async (tx) => {
      await drizzleOf(tx).execute(
        sql`create temporary table list_query_knights (id integer generated always as identity primary key, name text not null, age integer not null, title text not null, "order" text, joined timestamptz not null)`,
      );
      await drizzleOf(tx)
        .insert(knightTable)
        .values([...knights]);

      return Result.succeed();
    }),
  );
};

const namesPage = async (
  overrides: Partial<ListQuery<"name" | "age", KnightFilters>>,
): Promise<Readonly<{ items: readonly string[]; hasNextPage: boolean }>> => {
  const page = Result.unwrap(
    await asSystem(async (tx) =>
      Result.succeed(
        await applyListQuery(
          async ({ where, orderBy, limit, offset }): Promise<readonly (typeof knightTable.$inferSelect)[]> =>
            drizzleOf(tx)
              .select()
              .from(knightTable)
              .where(where)
              .orderBy(...orderBy)
              .limit(limit)
              .offset(offset),
          spec,
          query(overrides),
        ),
      ),
    ),
  );

  return { items: page.items.map((knight) => knight.name), hasNextPage: page.hasNextPage };
};

const names = async (overrides: Partial<ListQuery<"name" | "age", KnightFilters>>): Promise<readonly string[]> => (await namesPage(overrides)).items;

const matching = async (filters: KnightFilters): Promise<readonly string[]> => (await names({ filters })).toSorted();

const withKnights = async (check: () => Promise<void>): Promise<void> => {
  await withRollback(async () => {
    await seedKnights();
    await check();
  });
};

after(closeDb);

test("without sortBy or filters every row is listed", async () => {
  await withKnights(async () => {
    assert.deepEqual(await matching({}), ["Adolin", "Dalinar", "Kaladin", "Teft"]);
  });
});

test("sortBy sorts strings and numbers, ascending by default", async () => {
  await withKnights(async () => {
    assert.deepEqual(await names({ sortBy: "name" }), ["Adolin", "Dalinar", "Kaladin", "Teft"]);
    assert.deepEqual(await names({ sortBy: "age", sortDirection: "ascending" }), ["Kaladin", "Adolin", "Teft", "Dalinar"]);
    assert.deepEqual(await names({ sortBy: "age", sortDirection: "descending" }), ["Dalinar", "Teft", "Adolin", "Kaladin"]);
  });
});

test("contains matches a substring regardless of case", async () => {
  await withKnights(async () => {
    assert.deepEqual(await matching({ name: "LIN" }), ["Adolin", "Dalinar"]);
    assert.deepEqual(await matching({ name: "%" }), []);
    assert.deepEqual(await matching({ name: "_" }), []);
  });
});

test("equals matches the whole value only", async () => {
  await withKnights(async () => {
    assert.deepEqual(await matching({ title: "Highprince" }), ["Adolin", "Dalinar"]);
    assert.deepEqual(await matching({ title: "High" }), []);
  });
});

test("inRange includes both bounds and leaves a missing bound open", async () => {
  await withKnights(async () => {
    assert.deepEqual(await matching({ age: { min: 23, max: 40 } }), ["Adolin", "Teft"]);
    assert.deepEqual(await matching({ age: { min: 40 } }), ["Dalinar", "Teft"]);
    assert.deepEqual(await matching({ age: { max: 20 } }), ["Kaladin"]);
  });
});

test("inDateRange compares whole days and includes both ends", async () => {
  await withKnights(async () => {
    assert.deepEqual(await matching({ joined: { from: "2026-01-15", to: "2026-03-01" } }), ["Adolin", "Dalinar", "Kaladin"]);
    assert.deepEqual(await matching({ joined: { from: "2026-03-02" } }), ["Teft"]);
  });
});

test("oneOf keeps rows whose value is listed and drops rows without a value", async () => {
  await withKnights(async () => {
    assert.deepEqual(await matching({ order: ["wind"] }), ["Kaladin", "Teft"]);
    assert.deepEqual(await matching({ order: ["wind", "bond"] }), ["Dalinar", "Kaladin", "Teft"]);
  });
});

test("filters combine and apply before sorting and paging", async () => {
  await withKnights(async () => {
    assert.deepEqual(await names({ filters: { order: ["wind", "bond"], age: { max: 45 } }, sortBy: "age", sortDirection: "descending" }), [
      "Teft",
      "Kaladin",
    ]);
  });
});

test("pages hold at most pageLimit rows and report whether another page follows", async () => {
  await withKnights(async () => {
    assert.deepEqual(await namesPage({ sortBy: "name", pageLimit: 3 }), { items: ["Adolin", "Dalinar", "Kaladin"], hasNextPage: true });
    assert.deepEqual(await namesPage({ sortBy: "name", pageLimit: 3, page: 2 }), { items: ["Teft"], hasNextPage: false });
    assert.deepEqual(await namesPage({ sortBy: "name", pageLimit: 2, page: 2 }), { items: ["Kaladin", "Teft"], hasNextPage: false });
    assert.deepEqual(await namesPage({ sortBy: "name", page: 3, pageLimit: 2 }), { items: [], hasNextPage: false });
  });
});
