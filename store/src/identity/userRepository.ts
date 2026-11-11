import { Result } from "@praha/byethrow";
import type { ListUsersPage, ListUsersQuery, StoredUser, User, UserFilters, UserSort } from "@wizard/domain";
import { eq } from "drizzle-orm";

import { type DatabaseError, databaseError, drizzleOf, type Tx } from "../shared/db.ts";
import { applyListQuery, contains, inDateRange, inRange, type ListSpec, oneOf } from "../shared/listQuery.ts";
import { userTable } from "./userTable.ts";

type UserRow = typeof userTable.$inferSelect;

const userListSpec: ListSpec<UserSort, UserFilters> = {
  sort: { name: userTable.name, age: userTable.age, swornOn: userTable.swornOn },
  filters: {
    name: contains(userTable.name),
    age: inRange(userTable.age),
    order: oneOf(userTable.order),
    swornOn: inDateRange(userTable.swornOn),
  },
};

const toStoredUser = ({ id, userId, name, age, order, swornOn }: Readonly<UserRow>): StoredUser => ({
  id: String(id),
  userId,
  name,
  age,
  ...(order === null ? {} : { order }),
  swornOn: swornOn.toISOString(),
});

const rowIdOf = (id: string): number | undefined => (/^\d+$/u.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : undefined);

export const users = (
  tx: Tx,
): Readonly<{
  save: (user: User) => Result.ResultAsync<StoredUser, DatabaseError>;
  find: (id: string) => Result.ResultAsync<StoredUser | undefined, DatabaseError>;
  list: (query: ListUsersQuery) => Result.ResultAsync<ListUsersPage, DatabaseError>;
}> => {
  const db = drizzleOf(tx);

  return {
    save: async ({ name, age, order }) =>
      Result.try({
        try: async () => {
          const [saved] = await db
            .insert(userTable)
            .values({ name, age, ...(order === undefined ? {} : { order }) })
            .returning();

          return saved === undefined ? Promise.reject(new Error("The insert returned no row.")) : toStoredUser(saved);
        },
        catch: databaseError,
      }),
    find: async (id): Result.ResultAsync<StoredUser | undefined, DatabaseError> => {
      const rowId = rowIdOf(id);

      return rowId === undefined
        ? Result.succeed(undefined)
        : Result.try({
            try: async () => {
              const [found] = await db.select().from(userTable).where(eq(userTable.id, rowId));

              return found === undefined ? undefined : toStoredUser(found);
            },
            catch: databaseError,
          });
    },
    list: async (query) =>
      Result.try({
        try: async () => {
          const page = await applyListQuery(
            async ({ where, orderBy, limit, offset }): Promise<readonly UserRow[]> =>
              db
                .select()
                .from(userTable)
                .where(where)
                .orderBy(...orderBy)
                .limit(limit)
                .offset(offset),
            userListSpec,
            query,
          );

          return { items: page.items.map(toStoredUser), hasNextPage: page.hasNextPage };
        },
        catch: databaseError,
      }),
  };
};
