import { createHTTPServer } from "@trpc/server/adapters/standalone";

import { appRouter } from "./appRouter.ts";
import { createContext } from "./context.ts";

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

server.listen(Number(process.env["API_PORT"] ?? "3000"));
