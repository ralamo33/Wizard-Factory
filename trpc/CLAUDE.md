# trpc

- Every procedure picks `publicProcedure`, `protectedProcedure` or `permissionProcedure(...)` on purpose. Default to protected.
- Input schemas never contain `userId` / `user_id`. Use `ctx.viewer`.
- Permissions come from the `app_permissions` claim (publicMetadata only).
