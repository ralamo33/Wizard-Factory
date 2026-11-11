import type { Result } from "@praha/byethrow";
import type { StoredUser, Viewer } from "@wizard/domain";
import { users } from "@wizard/store/identity";
import { type DatabaseError, transactionSealed } from "@wizard/store/shared";

export const findUser = async (viewer: Viewer, id: string): Result.ResultAsync<StoredUser | undefined, DatabaseError> =>
  transactionSealed(viewer, async (tx) => users(tx).find(id));
