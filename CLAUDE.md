# Wizard-Factory

## Where code goes

- **`domain`** holds the rules as zod schemas, with types derived from them via `z.infer`. No functions, no `Result`, no hand-written interfaces. Enforced by `wizard/schema-exports`.
- **`service`** holds the functions that act on domain data. Validation is `Result.parse(schema)` from `@praha/byethrow`, e.g. `export const createUser = Result.parse(userSchema);`. Every export is a function. Enforced by `wizard/function-exports`.
- **`store`** holds the mutable state (e.g. the user `Map`) behind functions; `service` calls them.
- **`trpc`** is the API: `appRouter` wires procedures to `service` functions, and `server.ts` runs it. Every export is a function, except the allowlisted `appRouter` and `publicProcedure`.
- **`web`** consumes `trpc`.
- Everything that creates or changes domain data goes through `service`; other packages never import a domain schema to validate on their own.

Example: `domain/src/user.ts` (`userSchema`, `User`) → `service/src/createUser.ts` (`createUser`) → `store/src/userStore.ts` (`saveUser`).

The `wizard/*` rules live in `exportRules.ts`.

## Module boundaries

`web → trpc → service → store`; every package may import `domain`. Files in `service` never import from a parent directory. Enforced by dependency-cruiser (`.dependency-cruiser.json`, `pnpm depcruise`).
