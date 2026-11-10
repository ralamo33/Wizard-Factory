import { z } from "zod";

import {
  containsFilterSchema,
  dateRangeFilterSchema,
  listPageSchema,
  listQuerySchema,
  oneOfFilterSchema,
  rangeFilterSchema,
} from "../shared/listQuery.ts";
import { orderSchema } from "./order.ts";
import { storedUserSchema } from "./user.ts";

export const userSortSchema = z.enum(["name", "age", "swornOn"], { error: "Sort by name, age or sworn on." });

export type UserSort = z.infer<typeof userSortSchema>;

export const userFiltersSchema = z
  .object({
    name: containsFilterSchema,
    age: rangeFilterSchema,
    order: oneOfFilterSchema(orderSchema),
    swornOn: dateRangeFilterSchema,
  })
  .readonly();

export type UserFilters = z.infer<typeof userFiltersSchema>;

export const listUsersQuerySchema = listQuerySchema(userSortSchema, userFiltersSchema);

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const listUsersPageSchema = listPageSchema(storedUserSchema);

export type ListUsersPage = z.infer<typeof listUsersPageSchema>;
