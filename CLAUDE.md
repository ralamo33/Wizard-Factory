# Wizard-Factory

This is a monorepo with strict linting and module boundaries.

## Where code goes

- **`domain`** holds the rules as zod schemas, with types derived from them via `z.infer`. No functions, no `Result`, no hand-written interfaces. Enforced by `wizard/schema-exports`.
- **`service`** holds the functions that act on domain data and all buisness logic.
- **`store`** accesses Supabase Postgres through Drizzle, only called by `service` directly. Drizzle and Supabase live only here.
- **`trpc`** is the API: `appRouter` wires procedures to `service` functions. this way presentation layer can communicate with the service without importing service directly
- **`web`** consumes `trpc`, a presentation layer

- Everything that creates or changes domain data goes through `service`.
  Example: `domain/src/identity/user.ts` (`userSchema`, `User`) → `service/src/identity/createUser.ts` (`createUser`) → `store/src/identity/userRepository.ts` (`users(tx).save`).

Each package with its own rules has a `CLAUDE.md`: `domain`, `store`, `service`, `trpc`, `web`. The `wizard/*` rules live in `exportRules.ts`.

## Module boundaries

`web → trpc → service → store`; every package may import `domain`

## Auth

- Authentication is Clerk. `@clerk/*` is imported only in `web` (`@clerk/react`) and `trpc` (`@clerk/backend`). Enforced by dependency-cruiser.
- `drizzle-orm`, `postgres`, `@supabase/*` are imported only in `store`. Enforced by dependency-cruiser.
- API-level authorization lives in `trpc` procedure types. Row-level authorization lives in RLS policies in `store`. `service` never re-checks ownership by hand, and never filters by userId to fake RLS.
- Ownership standard: an owned table has `user_id text not null`, holding the Clerk user id, with policies on `auth.jwt()->>'sub'`.
- The caller's identity only ever comes from the verified token (`ctx.viewer`), never from request input.

## Bounded contexts

`domain`, `store` and `service` are sliced by bounded context, with the same folder name in each `src` (today: `identity`). This is how the project grows: a new business capability gets a new context folder in each of those packages, never a new layer. `web` has its own layout; see `web/CLAUDE.md`.
Name contexts after business capabilities (`identity`, `billing`, `catalog`), not technical terms.
`shared/` (in `domain`, `store` and `service`) is the one place allowed to hold cross-context code. Files inside are named for their role (`listQuery.ts`); everything business-specific stays in its context.

## List APIs

- Sort, filter and page on the server; the store applies them (`store/src/shared/listQuery.ts`).
- Every list API is paginated by default: `pageLimit` 100, optionally up to 1000.
- Responses return `{ items, hasNextPage }`, never a total.
