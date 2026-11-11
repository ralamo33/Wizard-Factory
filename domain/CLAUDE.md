# domain

- Validation lives in the schemas.
- Every constraint carries a meaningful, human-readable error message. These messages are shown to users as-is, so write them for the person filling in the form (`"Enter your name"`, `"Age must be 18 or older"`), not for developers (`"Invalid input"`, `"Expected number"`).
- List APIs build their query with `listQuerySchema(sort, filters)` and return `listPageSchema(item)`, both from `domain/src/shared/listQuery.ts`.
- Owned entities' stored schema includes `userId: clerkUserIdSchema`. Input schemas never do.
