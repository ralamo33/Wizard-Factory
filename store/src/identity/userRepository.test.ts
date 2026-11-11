import assert from "node:assert/strict";
import { after, test } from "node:test";

import { Result } from "@praha/byethrow";
import type { Viewer } from "@wizard/domain";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";

import { asSystem, drizzleOf, transactionSealed } from "../shared/db.ts";
import { closeDb, withRollback } from "../shared/dbTestOnly.ts";
import { users } from "./userRepository.ts";
import { userTable } from "./userTable.ts";

const kaladin: Viewer = { userId: "user_kaladin", permissions: [] };
const shallan: Viewer = { userId: "user_shallan", permissions: [] };
const firstPage = { page: 1, pageLimit: 100, filters: {} } as const;

after(closeDb);

const namesListedBy = async (viewer: Viewer, name: string): Promise<readonly string[]> =>
  Result.unwrap(await transactionSealed(viewer, async (tx) => users(tx).list({ ...firstPage, filters: { name } }))).items.map((user) => user.name);

test("saved users get a stable id, their owner and the date they were sworn", async () => {
  await withRollback(async () => {
    const saved = Result.unwrap(
      await transactionSealed(kaladin, async (tx) => users(tx).save({ name: "Store Kaladin", age: 20, order: "Windrunners" })),
    );

    assert.equal(saved.userId, "user_kaladin");
    assert.match(saved.swornOn, /^\d{4}-\d{2}-\d{2}T.*Z$/u);
    assert.deepEqual(Result.unwrap(await transactionSealed(kaladin, async (tx) => users(tx).find(saved.id))), saved);
    assert.deepEqual(
      Result.unwrap(await transactionSealed(kaladin, async (tx) => users(tx).list({ ...firstPage, filters: { name: "Store Kaladin" } }))).items,
      [saved],
    );
  });
});

test("finding an unknown id gives undefined", async () => {
  await withRollback(async () => {
    assert.equal(Result.unwrap(await transactionSealed(kaladin, async (tx) => users(tx).find("999999999"))), undefined);
    assert.equal(Result.unwrap(await transactionSealed(kaladin, async (tx) => users(tx).find("not-a-number"))), undefined);
  });
});

test("listUsers filters, sorts and pages the stored users", async () => {
  await withRollback(async () => {
    Result.unwrap(
      await transactionSealed(kaladin, async (tx) => {
        await users(tx).save({ name: "Store Kaladin", age: 20, order: "Windrunners" });
        await users(tx).save({ name: "Store Shallan", age: 17, order: "Lightweavers" });
        await users(tx).save({ name: "Store Dalinar", age: 53, order: "Bondsmiths" });

        return users(tx).save({ name: "Store Lift", age: 13 });
      }),
    );

    const page = Result.unwrap(
      await transactionSealed(kaladin, async (tx) =>
        users(tx).list({ page: 1, pageLimit: 2, sortBy: "age", sortDirection: "descending", filters: { name: "store", age: { max: 30 } } }),
      ),
    );

    assert.deepEqual(
      page.items.map((user) => user.name),
      ["Store Kaladin", "Store Shallan"],
    );
    assert.equal(page.hasNextPage, true);

    const byOrder = Result.unwrap(
      await transactionSealed(kaladin, async (tx) =>
        users(tx).list({ ...firstPage, filters: { order: ["Bondsmiths", "Lightweavers"], name: "store" } }),
      ),
    );

    assert.deepEqual(byOrder.items.map((user) => user.name).toSorted(), ["Store Dalinar", "Store Shallan"]);
  });
});

test("everyone signed in reads a knight but only its owner changes it", async () => {
  await withRollback(async () => {
    const saved = Result.unwrap(await transactionSealed(kaladin, async (tx) => users(tx).save({ name: "Store Kaladin", age: 20 })));
    const id = Number(saved.id);

    assert.deepEqual(Result.unwrap(await transactionSealed(shallan, async (tx) => users(tx).find(saved.id))), saved);

    const changedByOther = Result.unwrap(
      await transactionSealed(shallan, async (tx) =>
        Result.succeed({
          updated: await drizzleOf(tx).update(userTable).set({ name: "Store Shallan" }).where(eq(userTable.id, id)).returning(),
          deleted: await drizzleOf(tx).delete(userTable).where(eq(userTable.id, id)).returning(),
        }),
      ),
    );

    assert.deepEqual(changedByOther, { updated: [], deleted: [] });
    assert.deepEqual(await namesListedBy(kaladin, "Store Kaladin"), ["Store Kaladin"]);

    const updatedByOwner = Result.unwrap(
      await transactionSealed(kaladin, async (tx) =>
        Result.succeed(await drizzleOf(tx).update(userTable).set({ name: "Store Stormblessed" }).where(eq(userTable.id, id)).returning()),
      ),
    );

    assert.equal(updatedByOwner.length, 1);
    assert.deepEqual(await namesListedBy(shallan, "Store Stormblessed"), ["Store Stormblessed"]);
  });
});

test("inserting a knight for someone else is rejected", async () => {
  await withRollback(async () => {
    const result = await transactionSealed(shallan, async (tx) => {
      await drizzleOf(tx).insert(userTable).values({ name: "Store Impostor", age: 30, userId: kaladin.userId });

      return Result.succeed();
    });

    assert.equal(result.type, "Failure");
    assert.deepEqual(await namesListedBy(kaladin, "Store Impostor"), []);
  });
});

test("the app_user connection outside transactionSealed is refused", async () => {
  const appUser = postgres(process.env["DATABASE_URL"] ?? "", { prepare: false, max: 1 });

  await assert.rejects(appUser`select * from users`, { code: "42501" });
  await appUser.end();
});

test("an Err inside transactionSealed rolls back the write and comes back as an Err", async () => {
  await withRollback(async () => {
    const result = await transactionSealed(kaladin, async (tx) => {
      await users(tx).save({ name: "Store Rolled Back", age: 20 });

      return Result.fail({ name: "Abandoned" });
    });

    assert.deepEqual(result, { type: "Failure", error: { name: "Abandoned" } });
    assert.deepEqual(await namesListedBy(kaladin, "Store Rolled Back"), []);
  });
});

test("an Err outside withRollback rolls back the real transaction", async () => {
  const result = await transactionSealed(kaladin, async (tx) => {
    await users(tx).save({ name: "Store Never Committed", age: 20 });

    return Result.fail({ name: "Abandoned" });
  });

  assert.deepEqual(result, { type: "Failure", error: { name: "Abandoned" } });
  assert.deepEqual(await namesListedBy(kaladin, "Store Never Committed"), []);
});

test("a driver failure inside transactionSealed comes back as an Err without throwing", async () => {
  const result = await transactionSealed(kaladin, async (tx) => {
    await drizzleOf(tx).execute(sql`select 1 / 0`);

    return Result.succeed();
  });

  assert.equal(result.type, "Failure");
  assert.equal(Result.isFailure(result) ? result.error.name : undefined, "DatabaseError");
});

test("repositories turn driver failures into a DatabaseError", async () => {
  const result = await transactionSealed(kaladin, async (tx) => {
    await drizzleOf(tx)
      .execute(sql`select 1 / 0`)
      .catch(() => undefined);

    return Result.fail({ name: "Carried", found: await users(tx).find("1") });
  });
  const error = Result.unwrapError(result);
  const found = error.name === "Carried" ? error.found : undefined;

  assert.equal(found !== undefined && Result.isFailure(found) ? found.error.name : undefined, "DatabaseError");
});

test("every table in public has row level security enabled", async () => {
  const unprotected = Result.unwrap(
    await asSystem(async (tx) =>
      Result.succeed(
        await drizzleOf(tx).execute<{ tablename: string }>(sql`select tablename from pg_tables where schemaname = 'public' and not rowsecurity`),
      ),
    ),
  );

  assert.deepEqual([...unprotected], []);
});
