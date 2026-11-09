# Wizard-Factory

## Where code goes

- **`domain`** holds the rules as zod schemas, with types derived from them via `z.infer`. No functions, no `Result`, no hand-written interfaces. Enforced by `wizard/schema-exports`.
- **`trpc`** holds the functions that act on domain data. Validation is `Result.parse(schema)` from `@praha/byethrow`, e.g. `export const createUser = Result.parse(userSchema);`. Every export is a function, except the allowlisted `appRouter` and `publicProcedure`. Enforced by `wizard/function-exports`. No data mutation (`functional/immutable-data`).
- **`store`** holds the mutable state (e.g. the user `Map`) behind functions; `trpc` calls them.
- Everything that creates or changes domain data goes through `trpc`; other packages never import a domain schema to validate on their own.

Example: `domain/src/user.ts` (`userSchema`, `User`) → `trpc/src/createUser.ts` (`createUser`) → `store/src/userStore.ts` (`saveUser`).

The `wizard/*` rules live in `exportRules.ts` and are tested in `tools/src/lintRules.test.ts`.
