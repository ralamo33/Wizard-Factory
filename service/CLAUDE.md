# service

The functions that act on domain data. Everything that creates or changes domain data goes through here. Bounded-context rules are in the root `CLAUDE.md`.

- Validation is `Result.parse(schema)` from `@praha/byethrow`, e.g. `export const createUser = Result.parse(userSchema);`.
- Every export is a function. Enforced by `wizard/function-exports`.
- A context `index.ts` re-exports exactly one function per file, named after the file. Enforced by `wizard/index-reexports`.
- Files never import from a parent directory.
- `service/src/index.ts` only re-exports context indexes.
- A context reaches only its own store context, via `@wizard/store/<context>`. Add the subpath to `store/package.json` `exports` for each new context.
- Wrap store functions in service functions; never re-export them. Enforced by eslint `no-restricted-syntax` on `service/src`.

Import rules are enforced by dependency-cruiser.
