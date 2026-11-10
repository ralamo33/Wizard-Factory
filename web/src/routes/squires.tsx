import { createFileRoute } from "@tanstack/react-router";
import { type ListUsersQuery, listUsersQuerySchema } from "@wizard/domain";
import type { JSX } from "react";

import { SquiresTableSection } from "../domainViews/identity/index.ts";

const Squires = (): JSX.Element => {
  const query = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleQueryChange = (search: ListUsersQuery): void => {
    void navigate({ search });
  };

  return (
    <main>
      <SquiresTableSection query={query} onQueryChange={handleQueryChange} />
    </main>
  );
};

export const Route = createFileRoute("/squires")({
  validateSearch: listUsersQuerySchema,
  component: Squires,
});
