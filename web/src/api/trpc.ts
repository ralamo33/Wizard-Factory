import { getToken } from "@clerk/react";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@wizard/trpc";

export const queryClient = new QueryClient();

const authorizationHeader = async (): Promise<Readonly<{ authorization?: string }>> => {
  const token = await getToken();

  return token === null ? {} : { authorization: `Bearer ${token}` };
};

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: "/trpc", headers: authorizationHeader })] }),
  queryClient,
});
