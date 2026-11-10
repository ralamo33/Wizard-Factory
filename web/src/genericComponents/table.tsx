import { type ColumnDef, rowSortingFeature, type SortingState, tableFeatures, useTable } from "@tanstack/react-table";
import { type JSX, type ReactNode, useId, useMemo } from "react";

export type SortDirection = "ascending" | "descending";

export type TableSort<Sort extends string> = Readonly<{ sortBy?: Sort | undefined; sortDirection?: SortDirection | undefined }>;

export type Density = "compact" | "comfortable";

type SortableColumn<Row, Sort extends string> = Readonly<{ id: Sort; header: string; cell: (row: Row) => ReactNode; sortable: true }>;

export type TableColumn<Row, Sort extends string> =
  SortableColumn<Row, Sort> | Readonly<{ id: string; header: string; cell: (row: Row) => ReactNode; sortable?: false }>;

const features = tableFeatures({ rowSortingFeature });

const cellPadding: Readonly<Record<Density, string>> = { compact: "px-3 py-1.5", comfortable: "px-4 py-3" };

const ariaSort = { asc: "ascending", desc: "descending" } as const;

const toSorting = <Sort extends string>({ sortBy, sortDirection }: TableSort<Sort>): SortingState =>
  sortBy === undefined ? [] : [{ id: sortBy, desc: sortDirection === "descending" }];

const SortIcon = ({ sorted }: Readonly<{ sorted: false | "asc" | "desc" }>): JSX.Element => (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    {sorted === false ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" /> : undefined}
    {sorted === "asc" ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-6 6l6-6 6 6" /> : undefined}
    {sorted === "desc" ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m6-6l-6 6-6-6" /> : undefined}
  </svg>
);

export type TableProps<Row, Sort extends string> = Readonly<{
  caption: string;
  isCaptionVisible?: boolean;
  columns: readonly TableColumn<Row, Sort>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  sort: TableSort<Sort>;
  onSortChange: (sort: TableSort<Sort>) => void;
  density?: Density | undefined;
  emptyState: string | Readonly<JSX.Element>;
}>;

export const Table = <Row extends object, Sort extends string>({
  caption,
  isCaptionVisible = false,
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  density = "comfortable",
  emptyState,
}: TableProps<Row, Sort>): JSX.Element => {
  const captionId = useId();
  const columnDefs = useMemo(
    (): ColumnDef<typeof features, Row>[] =>
      columns.map((column) => ({
        id: column.id,
        header: column.header,
        accessorFn: (row: Row): Row => row,
        cell: ({ row }): ReactNode => column.cell(row.original),
        enableSorting: column.sortable === true,
      })),
    [columns],
  );
  const data = useMemo(() => [...rows], [rows]);
  const sorting = toSorting(sort);

  const table = useTable({
    features,
    columns: columnDefs,
    data,
    getRowId: rowKey,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: true,
    sortDescFirst: false,
    state: { sorting },
    onSortingChange: (updater) => {
      const [next] = typeof updater === "function" ? updater(sorting) : updater;
      const column = columns.find((candidate): candidate is SortableColumn<Row, Sort> => candidate.sortable === true && candidate.id === next?.id);

      onSortChange(column === undefined || next === undefined ? {} : { sortBy: column.id, sortDirection: next.desc ? "descending" : "ascending" });
    },
  });
  const padding = cellPadding[density];

  return (
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-border bg-card/60 backdrop-blur-md"
    >
      <table className="w-full text-left text-card-foreground">
        <caption id={captionId} className={isCaptionVisible ? "p-4 text-left font-display text-lg" : "sr-only"}>
          {caption}
        </caption>
        <thead className="border-b border-border font-display text-xs tracking-widest text-muted-foreground uppercase">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const label = String(header.column.columnDef.header);

                return (
                  <th key={header.id} scope="col" aria-sort={sorted === false ? undefined : ariaSort[sorted]} className={padding}>
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 uppercase hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {label}
                        <SortIcon sorted={sorted} />
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`${padding} text-center text-muted-foreground italic`}>
                {emptyState}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                {row.getAllCells().map((cell, index) =>
                  index === 0 ? (
                    <th key={cell.id} scope="row" className={`${padding} font-normal`}>
                      <table.FlexRender cell={cell} />
                    </th>
                  ) : (
                    <td key={cell.id} className={padding}>
                      <table.FlexRender cell={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
