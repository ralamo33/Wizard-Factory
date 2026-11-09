# Tasks

- [ ] **Enforce checks automatically** — pre-commit hook, CI workflow, and a Claude Code hook that runs `pnpm check` after edits so agent output can't land unchecked.
- [ ] **Add a formatter** — Biome is disabled in `.vscode/settings.json` with nothing in its place; quotes and semicolons are inconsistent across files.
- [ ] **Wire `createUser` into the router** — `userSchema` (zod, all rules) lives in `domain/src/user.ts`; `createUser = Result.parse(userSchema)` lives in `service/src/createUser.ts`. The router's `createUser` mutation still validates with its own inline `z.object` and doesn't call it — needs a decision on how a failed `Result` reaches the client without `throw` (or use `.input(userSchema)` and let tRPC return `BAD_REQUEST`).
- [ ] **Tests for every package** — `tools`, `domain`, `service`, `store` have tests; `trpc`, `web` have none. `trpc` has no router tests yet.
- [ ] **Document the subset in README** — README is just the title twice; write down the rules and the reasoning so agents can read them.
- [ ] **Commit the work** — domain/trpc/store split, `wizard/*` export rules, and the `web` Vite/React move are uncommitted. `pnpm check` passes.
- [ ] **Bounded contexts in `service`** — `service/src/<context>/`, a context imports only its own files or another context's `index.ts`; dependency-cruiser `$1` group-matching rule.
- [x] **Enforce module boundaries** — `wizard/schema-exports` (`domain` exports only zod schemas and `z.infer` types) and `wizard/function-exports` (`service` exports only functions), in `exportRules.ts`. User state moved to `store`.
- [x] **Package graph** — `web → trpc → service → store`, all may import `domain`; no parent-directory imports in `service`. dependency-cruiser, `.dependency-cruiser.json`.
