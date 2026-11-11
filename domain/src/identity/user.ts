import { z } from "zod";

import { orderSchema } from "./order.ts";
import { clerkUserIdSchema } from "./viewer.ts";

export const userSchema = z
  .object({
    name: z.string({ error: "Enter your name." }).refine((name) => name.trim() !== "", { error: "Enter your name." }),
    age: z
      .number({ error: "Enter your age as a number." })
      .int({ error: "Enter your age as a whole number." })
      .nonnegative({ error: "Age cannot be negative." }),
    order: orderSchema.optional(),
  })
  .readonly();

export type User = z.infer<typeof userSchema>;

export const storedUserSchema = userSchema
  .unwrap()
  .extend({
    id: z.string({ error: "A stored user needs an id." }),
    userId: clerkUserIdSchema,
    swornOn: z.iso.datetime({ error: "Sworn on must be an ISO date and time." }),
  })
  .readonly();

export type StoredUser = z.infer<typeof storedUserSchema>;
