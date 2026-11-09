import { z } from "zod";

export const userSchema = z
  .object({
    name: z.string().refine((name) => name.trim() !== ""),
    age: z.number().int().nonnegative(),
  })
  .readonly();

export type User = z.infer<typeof userSchema>;
