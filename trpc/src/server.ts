import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { appRouter } from "./appRouter.ts";

const server = createHTTPServer({
  router: appRouter,
});

server.listen(Number(process.env["API_PORT"] ?? "3000"));
