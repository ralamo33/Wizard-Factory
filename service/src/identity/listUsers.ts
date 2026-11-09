import type { User } from "@wizard/domain";
import * as userStore from "@wizard/store/identity";

export const listUsers = (): readonly User[] => userStore.listUsers();
