import type { ListUsersPage, ListUsersQuery, StoredUser, User, UserFilters, UserSort } from "@wizard/domain";

import { applyListQuery, contains, inDateRange, inRange, type ListSpec, oneOf } from "../shared/listQuery.ts";

const users = new Map<string, StoredUser>();

const userListSpec: ListSpec<StoredUser, UserSort, UserFilters> = {
  sort: { name: (user) => user.name, age: (user) => user.age, swornOn: (user) => user.swornOn },
  filters: {
    name: contains((user: StoredUser) => user.name),
    age: inRange((user: StoredUser) => user.age),
    order: oneOf((user: StoredUser) => user.order),
    swornOn: inDateRange((user: StoredUser) => user.swornOn),
  },
};

export const saveUser = (user: User): void => {
  const id = String(users.size + 1);

  users.set(id, { ...user, id, swornOn: new Date().toISOString() });
};

export const findUser = (id: string): StoredUser | undefined => users.get(id);

export const listUsers = (query: ListUsersQuery): ListUsersPage => applyListQuery([...users.values()], userListSpec, query);
