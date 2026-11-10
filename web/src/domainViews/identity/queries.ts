import { keepPreviousData, type QueryClient, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import type { ListUsersPage, ListUsersQuery, StoredUser, User } from "@wizard/domain";

import { trpc } from "../../api/trpc.ts";

type SwearOath = (user: User, onSworn: () => void) => void;

type SquiresPage = Readonly<{ page: ListUsersPage | undefined; isLoading: boolean }>;

const newestSquires = { sortBy: "swornOn", sortDirection: "descending" } as const;
const swearOathKey = trpc.createUser.mutationKey();

export const prefetchSquires = async (queryClient: Readonly<QueryClient>): Promise<void> => {
  await queryClient.query({ ...trpc.listUsers.queryOptions(newestSquires), staleTime: "static" });
};

export const useSquires = (): readonly StoredUser[] => useSuspenseQuery(trpc.listUsers.queryOptions(newestSquires)).data.items;

export const useSquiresPage = (query: ListUsersQuery): SquiresPage => {
  const { data, isPending } = useQuery({ ...trpc.listUsers.queryOptions(query), placeholderData: keepPreviousData });

  return { page: data, isLoading: isPending };
};

export const useSwearOath = (): SwearOath => {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    trpc.createUser.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.listUsers.pathFilter());
      },
    }),
  );

  return (user, onSworn): void => {
    if (queryClient.isMutating({ mutationKey: swearOathKey }) === 0) {
      mutation.mutate(user, { onSuccess: onSworn });
    }
  };
};
