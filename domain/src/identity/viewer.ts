import { z } from "zod";

export const clerkUserIdSchema = z.string({ error: "Sign in again to continue." }).startsWith("user_", { error: "Sign in again to continue." });

export type ClerkUserId = z.infer<typeof clerkUserIdSchema>;

export const permissionSchema = z.enum(["users:manage"], { error: "That permission does not exist." });

export type Permission = z.infer<typeof permissionSchema>;

export const viewerSchema = z
  .object({
    userId: clerkUserIdSchema,
    permissions: z.array(permissionSchema).readonly(),
  })
  .readonly();

export type Viewer = z.infer<typeof viewerSchema>;
