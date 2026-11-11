import type { SortDirection } from "@wizard/domain";
import { and, asc, desc, eq, gte, ilike, inArray, lt, lte, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export type ListQuery<Sort extends string, Filters> = Readonly<{
  sortBy?: Sort | undefined;
  sortDirection?: SortDirection | undefined;
  page: number;
  pageLimit: number;
  filters: Filters;
}>;

export type ListPage<Row> = Readonly<{ items: readonly Row[]; hasNextPage: boolean }>;

type Condition<Value> = (value: Value) => SQL | undefined;

export type ListSpec<Sort extends string, Filters> = Readonly<{
  sort: Readonly<Record<Sort, PgColumn>>;
  filters: { readonly [K in keyof Filters]-?: Condition<NonNullable<Filters[K]>> };
}>;

type Range = Readonly<{ min?: number | undefined; max?: number | undefined }>;
type DateRange = Readonly<{ from?: string | undefined; to?: string | undefined }>;

const dayInMs = 86_400_000;

const startOfDay = (isoDay: string): Date => new Date(`${isoDay}T00:00:00.000Z`);

const startOfNextDay = (isoDay: string): Date => new Date(startOfDay(isoDay).getTime() + dayInMs);

const escapeLike = (text: string): string => text.replaceAll(/[\\%_]/gu, String.raw`\$&`);

export const contains =
  (column: PgColumn): Condition<string> =>
  (needle) =>
    ilike(column, `%${escapeLike(needle)}%`);

export const equals =
  <Value>(column: PgColumn): Condition<Value> =>
  (value) =>
    eq(column, value);

export const inRange =
  (column: PgColumn): Condition<Range> =>
  ({ min, max }) =>
    and(min === undefined ? undefined : gte(column, min), max === undefined ? undefined : lte(column, max));

export const inDateRange =
  (column: PgColumn): Condition<DateRange> =>
  ({ from, to }) =>
    and(from === undefined ? undefined : gte(column, startOfDay(from)), to === undefined ? undefined : lt(column, startOfNextDay(to)));

export const oneOf =
  <Value>(column: PgColumn): Condition<readonly Value[]> =>
  (values) =>
    inArray(column, [...values]);

const conditionFor = <Value>(condition: Condition<NonNullable<Value>>, value: Value): SQL | undefined =>
  value === undefined || value === null ? undefined : condition(value);

const whereOf = <Sort extends string, Filters>({ filters: conditions }: ListSpec<Sort, Filters>, filters: Filters): SQL | undefined =>
  and(
    ...Object.keys(conditions)
      .filter((key): key is Extract<keyof Filters, string> => key in conditions)
      .map((key) => conditionFor(conditions[key], filters[key])),
  );

const orderOf = <Sort extends string, Filters>(spec: ListSpec<Sort, Filters>, query: ListQuery<Sort, Filters>): readonly SQL[] => {
  if (query.sortBy === undefined) {
    return [];
  }

  const column = spec.sort[query.sortBy];

  return [query.sortDirection === "descending" ? desc(column) : asc(column)];
};

export type ListClauses = Readonly<{ where: SQL | undefined; orderBy: readonly SQL[]; limit: number; offset: number }>;

export const applyListQuery = async <Row, Sort extends string, Filters>(
  select: (clauses: ListClauses) => Promise<readonly Row[]>,
  spec: ListSpec<Sort, Filters>,
  query: ListQuery<Sort, Filters>,
): Promise<ListPage<Row>> => {
  const rows = await select({
    where: whereOf(spec, query.filters),
    orderBy: orderOf(spec, query),
    limit: query.pageLimit + 1,
    offset: (query.page - 1) * query.pageLimit,
  });

  return { items: rows.slice(0, query.pageLimit), hasNextPage: rows.length > query.pageLimit };
};
