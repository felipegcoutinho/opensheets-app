CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"disable_magnetlines" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Migrate existing data from user table to user_preferences
INSERT INTO "user_preferences" ("user_id", "disable_magnetlines", "created_at", "updated_at")
SELECT "id", COALESCE("disable_magnetlines", false), now(), now()
FROM "user"
WHERE "disable_magnetlines" IS NOT NULL OR "disable_magnetlines" = true;
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "disable_magnetlines";