import type { Result } from "@praha/byethrow";
import type { StoredUser, User, Viewer } from "@wizard/domain";
import { users } from "@wizard/store/identity";
import { type DatabaseError, transactionSealed } from "@wizard/store/shared";

export const saveUser = async (viewer: Viewer, user: User): Result.ResultAsync<StoredUser, DatabaseError> =>
  transactionSealed(viewer, async (tx) => users(tx).save(user));
