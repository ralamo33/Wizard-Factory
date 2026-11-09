import type { User } from "@wizard/domain";
import * as userStore from "@wizard/store/identity";

export const findUser = (id: string): User | undefined => userStore.findUser(id);
