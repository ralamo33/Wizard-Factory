import type { User } from "@wizard/domain";
import * as userStore from "@wizard/store/identity";

export const saveUser = (user: User): void => {
  userStore.saveUser(user);
};
