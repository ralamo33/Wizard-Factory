import type { Order } from "@wizard/domain";
import { sql } from "drizzle-orm";
import { index, integer, pgPolicy, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

const isOwner = sql`((select auth.jwt())->>'sub') = user_id`;

export const userTable = pgTable.withRLS(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .default(sql`(auth.jwt()->>'sub')`),
    name: text().notNull(),
    age: integer().notNull(),
    order: text().$type<Order>(),
    swornOn: timestamp("sworn_on", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("users_user_id_idx").on(table.userId),
    pgPolicy("users are readable by everyone signed in", { for: "select", to: authenticatedRole, using: sql`true` }),
    pgPolicy("users are created by their owner", { for: "insert", to: authenticatedRole, withCheck: isOwner }),
    pgPolicy("users are updated by their owner", { for: "update", to: authenticatedRole, using: isOwner, withCheck: isOwner }),
    pgPolicy("users are deleted by their owner", { for: "delete", to: authenticatedRole, using: isOwner }),
  ],
);
