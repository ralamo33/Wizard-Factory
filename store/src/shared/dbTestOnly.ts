import { TransactionRollbackError } from "drizzle-orm";

import { adminClient, adminDb, appClient, testTransaction } from "./db.ts";

const asError = (error: unknown): Error =>
  error instanceof Error
    ? error
    : new Error(typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error), { cause: error });

export const withRollback = async (check: () => Promise<void>): Promise<void> => {
  const failures: Error[] = [];

  await adminDb
    .transaction(async (drizzleTx) => {
      await testTransaction.run(drizzleTx, check).catch((error: unknown) => {
        failures.push(asError(error));
      });
      drizzleTx.rollback();
    })
    .catch(async (error: unknown) => (error instanceof TransactionRollbackError ? undefined : Promise.reject(asError(error))));

  const [failure] = failures;

  return failure === undefined ? undefined : Promise.reject(failure);
};

export const closeDb = async (): Promise<void> => {
  await Promise.all([appClient.end(), adminClient.end()]);
};
