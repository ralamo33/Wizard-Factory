import { type QueryClient, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import type { User } from "@wizard/domain";

import { trpc } from "../../api/trpc.ts";

type SwearOath = (user: User, onSworn: () => void) => void;

const squiresKey = trpc.listUsers.queryKey();
const swearOathKey = trpc.createUser.mutationKey();

export const prefetchSquires = async (queryClient: Readonly<QueryClient>): Promise<void> => {
  await queryClient.query({ ...trpc.listUsers.queryOptions(), staleTime: "static" });
};

export const useSquires = (): readonly User[] => useSuspenseQuery(trpc.listUsers.queryOptions()).data;

export const useSwearOath = (): SwearOath => {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    trpc.createUser.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: squiresKey });
      },
    }),
  );

  return (user, onSworn): void => {
    if (queryClient.isMutating({ mutationKey: swearOathKey }) === 0) {
      mutation.mutate(user, { onSuccess: onSworn });
    }
  };
};
