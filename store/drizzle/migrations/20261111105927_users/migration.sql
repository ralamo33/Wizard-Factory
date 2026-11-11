CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text DEFAULT (auth.jwt()->>'sub') NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"order" text,
	"sworn_on" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "users_user_id_idx" ON "users" ("user_id");--> statement-breakpoint
CREATE POLICY "users are readable by everyone signed in" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "users are created by their owner" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.jwt()->>'sub') = user_id);--> statement-breakpoint
CREATE POLICY "users are updated by their owner" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.jwt()->>'sub') = user_id) WITH CHECK ((select auth.jwt()->>'sub') = user_id);--> statement-breakpoint
CREATE POLICY "users are deleted by their owner" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.jwt()->>'sub') = user_id);