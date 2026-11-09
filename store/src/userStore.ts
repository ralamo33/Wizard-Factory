import type { User } from "@wizard/domain";

const users = new Map<string, User>();

export const saveUser = (user: User): void => {
  users.set(String(users.size + 1), user);
};

export const findUser = (id: string): User | undefined => users.get(id);

export const listUsers = (): readonly User[] => [...users.values()];
