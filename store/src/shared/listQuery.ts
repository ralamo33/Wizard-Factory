import type { SortDirection } from "@wizard/domain";

export type ListQuery<Sort extends string, Filters> = Readonly<{
  sortBy?: Sort | undefined;
  sortDirection?: SortDirection | undefined;
  page: number;
  pageLimit: number;
  filters: Filters;
}>;

export type ListPage<Row> = Readonly<{ items: readonly Row[]; hasNextPage: boolean }>;

type Matcher<Row, Value> = (row: Row, value: Value) => boolean;

export type ListSpec<Row, Sort extends string, Filters> = Readonly<{
  sort: Readonly<Record<Sort, (row: Row) => string | number>>;
  filters: { readonly [K in keyof Filters]-?: Matcher<Row, NonNullable<Filters[K]>> };
}>;

type Range = Readonly<{ min?: number | undefined; max?: number | undefined }>;
type DateRange = Readonly<{ from?: string | undefined; to?: string | undefined }>;

const isoDay = (isoDate: string): string => isoDate.slice(0, "YYYY-MM-DD".length);

export const contains =
  <Row>(field: (row: Row) => string): Matcher<Row, string> =>
  (row, needle) =>
    field(row).toLowerCase().includes(needle.toLowerCase());

export const equals =
  <Row, Value>(field: (row: Row) => Value): Matcher<Row, Value> =>
  (row, value) =>
    field(row) === value;

export const inRange =
  <Row>(field: (row: Row) => number): Matcher<Row, Range> =>
  (row, { min, max }) =>
    (min === undefined || field(row) >= min) && (max === undefined || field(row) <= max);

export const inDateRange =
  <Row>(field: (row: Row) => string): Matcher<Row, DateRange> =>
  (row, { from, to }) =>
    (from === undefined || isoDay(field(row)) >= from) && (to === undefined || isoDay(field(row)) <= to);

export const oneOf =
  <Row, Value>(field: (row: Row) => Value | undefined): Matcher<Row, readonly Value[]> =>
  (row, values) => {
    const value = field(row);

    return value !== undefined && values.includes(value);
  };

const compareValues = (a: string | number, b: string | number): number =>
  typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));

const matchesFilter = <Row, Value>(row: Row, matcher: Matcher<Row, NonNullable<Value>>, value: Value): boolean =>
  value === undefined || value === null || matcher(row, value);

const matchesFilters = <Row, Sort extends string, Filters>(
  row: Row,
  { filters: matchers }: ListSpec<Row, Sort, Filters>,
  filters: Filters,
): boolean =>
  Object.keys(matchers)
    .filter((key): key is Extract<keyof Filters, string> => key in matchers)
    .every((key) => matchesFilter(row, matchers[key], filters[key]));

const sortRows = <Row, Sort extends string, Filters>(
  rows: readonly Row[],
  spec: ListSpec<Row, Sort, Filters>,
  query: ListQuery<Sort, Filters>,
): readonly Row[] => {
  if (query.sortBy === undefined) {
    return rows;
  }

  const sortKey = spec.sort[query.sortBy];
  const direction = query.sortDirection === "descending" ? -1 : 1;

  return rows.toSorted((a, b) => direction * compareValues(sortKey(a), sortKey(b)));
};

export const applyListQuery = <Row, Sort extends string, Filters>(
  rows: readonly Row[],
  spec: ListSpec<Row, Sort, Filters>,
  query: ListQuery<Sort, Filters>,
): ListPage<Row> => {
  const sorted = sortRows(
    rows.filter((row) => matchesFilters(row, spec, query.filters)),
    spec,
    query,
  );
  const start = (query.page - 1) * query.pageLimit;
  const pageWithLookahead = sorted.slice(start, start + query.pageLimit + 1);

  return { items: pageWithLookahead.slice(0, query.pageLimit), hasNextPage: pageWithLookahead.length > query.pageLimit };
};
