import { z } from "zod";

export const sortDirectionSchema = z.enum(["ascending", "descending"], { error: "Sort ascending or descending." });

export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const containsFilterSchema = z.string({ error: "Enter text to search for." }).trim().min(1, { error: "Enter text to search for." }).optional();

export const equalsFilterSchema = z.string({ error: "Choose a value to match." }).trim().min(1, { error: "Choose a value to match." }).optional();

export const rangeFilterSchema = z
  .object({
    min: z.number({ error: "Enter the minimum as a number." }).optional(),
    max: z.number({ error: "Enter the maximum as a number." }).optional(),
  })
  .readonly()
  .optional();

export const dateRangeFilterSchema = z
  .object({
    from: z.iso.date({ error: "Enter the start date as YYYY-MM-DD." }).optional(),
    to: z.iso.date({ error: "Enter the end date as YYYY-MM-DD." }).optional(),
  })
  .readonly()
  .optional();

export const oneOfFilterSchema = <Option extends z.ZodType<string>>(optionSchema: Option): z.ZodOptional<z.ZodReadonly<z.ZodArray<Option>>> =>
  z.array(optionSchema).min(1, { error: "Choose at least one option." }).readonly().optional();

export const listQuerySchema = <Sort extends z.ZodType<string>, Filters extends z.ZodType<object>>(
  sortBySchema: Sort,
  filtersSchema: Filters,
): z.ZodReadonly<
  z.ZodObject<{
    sortBy: z.ZodOptional<Sort>;
    sortDirection: z.ZodOptional<typeof sortDirectionSchema>;
    page: z.ZodDefault<z.ZodNumber>;
    pageLimit: z.ZodDefault<z.ZodNumber>;
    filters: z.ZodPipe<z.ZodOptional<Filters>, z.ZodTransform<z.output<Filters>, z.output<Filters> | undefined>>;
  }>
> =>
  z
    .object({
      sortBy: sortBySchema.optional(),
      sortDirection: sortDirectionSchema.optional(),
      page: z
        .number({ error: "Page must be a number." })
        .int({ error: "Page must be a whole number." })
        .min(1, { error: "Pages start at 1." })
        .default(1),
      pageLimit: z
        .number({ error: "Page size must be a number." })
        .int({ error: "Page size must be a whole number." })
        .min(1, { error: "Show at least 1 row per page." })
        .max(1000, { error: "Show at most 1000 rows per page." })
        .default(100),
      // .default({}) cannot type-check against a generic schema, so missing filters parse as an empty object here.
      filters: filtersSchema.optional().transform((filters): z.output<Filters> => filters ?? filtersSchema.parse({})),
    })
    .readonly();

export const listPageSchema = <Item extends z.ZodType>(
  itemSchema: Item,
): z.ZodReadonly<z.ZodObject<{ items: z.ZodReadonly<z.ZodArray<Item>>; hasNextPage: z.ZodBoolean }>> =>
  z.object({ items: z.array(itemSchema).readonly(), hasNextPage: z.boolean() }).readonly();
