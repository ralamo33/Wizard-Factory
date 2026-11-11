import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/**/*Table.ts",
  out: "./drizzle/migrations",
  entities: { roles: { provider: "supabase" } },
  dbCredentials: { url: process.env["ADMIN_DATABASE_URL"] ?? "" },
});
