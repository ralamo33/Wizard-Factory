import type { JSX } from "react";

import { FilterBar, type FilterFields, hasActiveFilters } from "./filterBar.tsx";
import { Pager } from "./pager.tsx";
import { type Density, type SortDirection, Table, type TableColumn, type TableSort } from "./table.tsx";

type DataTableQuery<Sort extends string, Filters> = Readonly<{
  sortBy?: Sort | undefined;
  sortDirection?: SortDirection | undefined;
  page: number;
  pageLimit: number;
  filters: Filters;
}>;

type Noun = Readonly<{ one: string; other: string }>;

type DataTableProps<Row extends object, Sort extends string, Filters> = Readonly<{
  caption: string;
  isCaptionVisible?: boolean;
  noun: Noun;
  columns: readonly TableColumn<Row, Sort>[];
  filterFields: FilterFields<Filters>;
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  hasNextPage: boolean;
  isLoading: boolean;
  query: DataTableQuery<Sort, Filters>;
  onQueryChange: (query: DataTableQuery<Sort, Filters>) => void;
  density?: Density | undefined;
  emptyState: string | Readonly<JSX.Element>;
}>;

const statusMessage = <Row extends object, Sort extends string, Filters>({
  noun,
  columns,
  filterFields,
  rows,
  isLoading,
  query,
}: Pick<DataTableProps<Row, Sort, Filters>, "noun" | "columns" | "filterFields" | "rows" | "isLoading" | "query">): string => {
  if (isLoading) {
    return `Loading ${noun.other}`;
  }

  const sortedColumn = columns.find((column) => column.sortable === true && column.id === query.sortBy);
  const sorted = sortedColumn === undefined ? "" : `Sorted by ${sortedColumn.header}, ${query.sortDirection ?? "ascending"}. `;

  if (rows.length === 0) {
    return `${sorted}No ${noun.other} ${hasActiveFilters(filterFields, query.filters) ? "match these filters" : "to show"}`;
  }

  return `${sorted}Showing ${String(rows.length)} ${rows.length === 1 ? noun.one : noun.other} on page ${String(query.page)}`;
};

export const DataTable = <Row extends object, Sort extends string, Filters>(props: DataTableProps<Row, Sort, Filters>): JSX.Element => {
  const {
    caption,
    isCaptionVisible = false,
    columns,
    filterFields,
    rows,
    rowKey,
    hasNextPage,
    isLoading,
    query,
    onQueryChange,
    density,
    emptyState,
  } = props;

  const handleSortChange = ({ sortBy, sortDirection }: TableSort<Sort>): void => {
    onQueryChange({ ...query, sortBy, sortDirection, page: 1 });
  };

  const handleFiltersChange = (filters: Filters): void => {
    onQueryChange({ ...query, filters, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    onQueryChange({ ...query, page });
  };

  return (
    <div className="flex flex-col gap-6">
      <FilterBar label={`Filter ${caption}`} fields={filterFields} filters={query.filters} onFiltersChange={handleFiltersChange} />
      <p role="status" className="sr-only">
        {statusMessage(props)}
      </p>
      <Table
        caption={caption}
        isCaptionVisible={isCaptionVisible}
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        sort={query}
        onSortChange={handleSortChange}
        density={density}
        emptyState={isLoading ? `Loading ${props.noun.other}…` : emptyState}
      />
      <Pager label={`${caption} pages`} page={query.page} hasNextPage={hasNextPage} onPageChange={handlePageChange} />
    </div>
  );
};
