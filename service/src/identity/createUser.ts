import { Result } from "@praha/byethrow";
import { userSchema } from "@wizard/domain";

export const createUser = Result.parse(userSchema);
