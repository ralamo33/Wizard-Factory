import type { Result } from "@praha/byethrow";
import type { ListUsersPage, ListUsersQuery, Viewer } from "@wizard/domain";
import { users } from "@wizard/store/identity";
import { type DatabaseError, transactionSealed } from "@wizard/store/shared";

export const listUsers = async (viewer: Viewer, query: ListUsersQuery): Result.ResultAsync<ListUsersPage, DatabaseError> =>
  transactionSealed(viewer, async (tx) => users(tx).list(query));
