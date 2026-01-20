ALTER TABLE "user_preferences" ADD COLUMN "dashboard_widgets" jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "period_months_before";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "period_months_after";