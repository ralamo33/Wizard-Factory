# Wizard-Factory

This is a monorepo with strict linting and module boundaries.

## Where code goes

- **`domain`** holds the rules as zod schemas, with types derived from them via `z.infer`. No functions, no `Result`, no hand-written interfaces. Enforced by `wizard/schema-exports`.
- **`service`** holds the functions that act on domain data and all buisness logic.
- **`store`** accesses persisted data storage, only called by `service` directly.
- **`trpc`** is the API: `appRouter` wires procedures to `service` functions. this way presentation layer can communicate with the service without importing service directly
- **`web`** consumes `trpc`, a presentation layer

- Everything that creates or changes domain data goes through `service`.
  Example: `domain/src/identity/user.ts` (`userSchema`, `User`) → `service/src/identity/createUser.ts` (`createUser`) → `store/src/identity/userStore.ts` (`saveUser`).

Each package with its own rules has a `CLAUDE.md`: `domain`, `service`, `web`. The `wizard/*` rules live in `exportRules.ts`.

## Module boundaries

`web → trpc → service → store`; every package may import `domain`

## Bounded contexts

`domain`, `store` and `service` are sliced by bounded context, with the same folder name in each `src` (today: `identity`). This is how the project grows: a new business capability gets a new context folder in each of those packages, never a new layer. `web` has its own layout; see `web/CLAUDE.md`.
Name contexts after business capabilities (`identity`, `billing`, `catalog`), not technical terms.
`shared/` (in `domain`, `store` and `service`) is the one place allowed to hold cross-context code. Files inside are named for their role (`listQuery.ts`); everything business-specific stays in its context.

## List APIs

- Sort, filter and page on the server; the store applies them (`store/src/shared/listQuery.ts`).
- Every list API is paginated by default: `pageLimit` 100, optionally up to 1000.
- Responses return `{ items, hasNextPage }`, never a total.
