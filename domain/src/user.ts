import { Result } from "@praha/byethrow";

export interface User {
  readonly name: string;
  readonly age: number;
}

export type InvalidUser = { readonly type: "EmptyName" } | { readonly type: "InvalidAge"; readonly age: number };

export const createUser = (input: User): Result.Result<User, InvalidUser> => {
  if (input.name.trim() === "") {
    return Result.fail({ type: "EmptyName" });
  }
  if (!Number.isInteger(input.age) || input.age < 0) {
    return Result.fail({ type: "InvalidAge", age: input.age });
  }
  return Result.succeed(input);
};
