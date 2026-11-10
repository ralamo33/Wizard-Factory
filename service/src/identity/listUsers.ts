import type { ListUsersPage, ListUsersQuery } from "@wizard/domain";
import * as userStore from "@wizard/store/identity";

export const listUsers = (query: ListUsersQuery): ListUsersPage => userStore.listUsers(query);
