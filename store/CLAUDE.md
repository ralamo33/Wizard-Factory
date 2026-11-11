# store

- Request code reaches the DB only through `transactionSealed(viewer, fn)`. `Tx` stays opaque, and there is never a second way to build one.
- Repositories are `<table>(tx)` factory functions in their context.
- `asSystem` is for work with no user only, and is never exported out of `store`.
- Every table enables RLS. Owned tables use the standard `user_id` column + policies. Guard tests fail otherwise.
- Migrations come only from drizzle-kit `generate`. Never edit the SQL by hand.
