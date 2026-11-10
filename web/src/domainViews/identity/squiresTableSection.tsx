import { type ListUsersQuery, orderSchema, type StoredUser, type UserFilters, type UserSort } from "@wizard/domain";
import type { JSX } from "react";

import { DataTable } from "../../genericComponents/dataTable.tsx";
import type { FilterFields } from "../../genericComponents/filterBar.tsx";
import { SectionHeading } from "../../genericComponents/sectionHeading.tsx";
import type { TableColumn } from "../../genericComponents/table.tsx";
import { useSquiresPage } from "./queries.ts";

const swornOnFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

const squireColumns: readonly TableColumn<StoredUser, UserSort>[] = [
  { id: "name", header: "Name", sortable: true, cell: (user) => user.name },
  { id: "age", header: "Age", sortable: true, cell: (user) => user.age },
  { id: "order", header: "Order", cell: (user) => user.order ?? "Unsworn to an order" },
  {
    id: "swornOn",
    header: "Sworn on",
    sortable: true,
    cell: (user) => <time dateTime={user.swornOn}>{swornOnFormat.format(new Date(user.swornOn))}</time>,
  },
];

const squireFilterFields: FilterFields<UserFilters> = {
  name: { kind: "contains", label: "Name" },
  age: { kind: "range", label: "Age", minLabel: "Minimum age", maxLabel: "Maximum age" },
  order: { kind: "oneOf", label: "Order", options: orderSchema.options.map((order) => ({ value: order, label: order })) },
  swornOn: { kind: "dateRange", label: "Sworn", fromLabel: "Sworn from", toLabel: "Sworn until" },
};

const squireNoun = { one: "squire", other: "squires" } as const;

const noSquires: readonly StoredUser[] = [];

type SquiresTableSectionProps = Readonly<{ query: ListUsersQuery; onQueryChange: (query: ListUsersQuery) => void }>;

export const SquiresTableSection = ({ query, onQueryChange }: SquiresTableSectionProps): JSX.Element => {
  const { page, isLoading } = useSquiresPage(query);

  return (
    <section className="relative px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="The roll of Urithiru" title="Sworn Squires" />
        <div className="mt-12">
          <DataTable
            caption="Sworn squires"
            noun={squireNoun}
            columns={squireColumns}
            filterFields={squireFilterFields}
            rows={page?.items ?? noSquires}
            rowKey={(user) => user.id}
            hasNextPage={page?.hasNextPage ?? false}
            isLoading={isLoading}
            query={query}
            onQueryChange={onQueryChange}
            emptyState="The tower records no squire matching these filters."
          />
        </div>
      </div>
    </section>
  );
};
