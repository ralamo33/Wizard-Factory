import { AsyncLocalStorage } from "node:async_hooks";

import { Result } from "@praha/byethrow";
import type { Viewer } from "@wizard/domain";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const appClient = postgres(process.env["DATABASE_URL"] ?? "", { prepare: false });
export const adminClient = postgres(process.env["ADMIN_DATABASE_URL"] ?? "", { prepare: false });

const appDb = drizzle({ client: appClient });

export const adminDb = drizzle({ client: adminClient });

type Database = typeof adminDb;
export type DrizzleTx = Parameters<Parameters<Database["transaction"]>[0]>[0];

const drizzleKey = Symbol("tx");

export type Tx = Readonly<{ [drizzleKey]: DrizzleTx }>;

export type DatabaseError = Readonly<{ name: "DatabaseError"; message: string; cause: unknown }>;

type Work<T, E> = (tx: Tx) => Result.ResultMaybeAsync<T, E>;

type Prepare = (drizzleTx: DrizzleTx) => Promise<void>;

export const testTransaction = new AsyncLocalStorage<DrizzleTx>();

export const databaseError = (cause: unknown): DatabaseError => ({ name: "DatabaseError", message: "The database request failed.", cause });

export const drizzleOf = (tx: Tx): DrizzleTx => tx[drizzleKey];

const runTransaction = async <T, E>(db: Database | DrizzleTx, prepare: Prepare, work: Work<T, E>): Result.ResultAsync<T, E | DatabaseError> => {
  const abandoned: Result.Failure<E>[] = [];
  const outcome = await Result.try({
    try: async () =>
      db.transaction(async (drizzleTx) => {
        const abandon = (failure: Result.Failure<E>): never => {
          abandoned.push(failure);

          return drizzleTx.rollback();
        };

        await prepare(drizzleTx);

        const result = await work({ [drizzleKey]: drizzleTx });

        return Result.isFailure(result) ? abandon(result) : result.value;
      }),
    catch: databaseError,
  });

  return abandoned[0] ?? outcome;
};

const actAs =
  (viewer: Viewer): Prepare =>
  async (drizzleTx) => {
    await drizzleTx.execute(sql`set local role authenticated`);
    await drizzleTx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: viewer.userId, role: "authenticated" })}, true)`);
  };

const asOwner: Prepare = async () => {
  await Promise.resolve();
};

const forgetViewer = async (outer: DrizzleTx): Result.ResultAsync<void, DatabaseError> =>
  Result.try({
    try: async () => {
      await outer.execute(sql`reset role`);
      await outer.execute(sql`select set_config('request.jwt.claims', '', true)`);
    },
    catch: databaseError,
  });

const inTestTransaction = async <T, E>(outer: DrizzleTx, prepare: Prepare, work: Work<T, E>): Result.ResultAsync<T, E | DatabaseError> => {
  const result = await runTransaction(outer, prepare, work);
  const forgotten = await forgetViewer(outer);

  return Result.isFailure(forgotten) ? forgotten : result;
};

const run = async <T, E>(db: Database, prepare: Prepare, work: Work<T, E>): Result.ResultAsync<T, E | DatabaseError> => {
  const outer = testTransaction.getStore();

  return outer === undefined ? runTransaction(db, prepare, work) : inTestTransaction(outer, prepare, work);
};

export const transactionSealed = async <T, E>(viewer: Viewer, work: Work<T, E>): Result.ResultAsync<T, E | DatabaseError> =>
  run(appDb, actAs(viewer), work);

export const asSystem = async <T, E>(work: Work<T, E>): Result.ResultAsync<T, E | DatabaseError> => run(adminDb, asOwner, work);
