-- Create the subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"recordingCount" integer NOT NULL,
	"fileSizeLimitMB" integer NOT NULL,
	"durationDays" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Insert default subscription plans (use simple INSERT with ON CONFLICT)
INSERT INTO "subscriptions" ("id", "name", "recordingCount", "fileSizeLimitMB", "durationDays")
VALUES
  ('free', 'FREE', 2, 20, 30),
  ('basic', 'BASIC', 4, 100, 90),
  ('enterprise', 'ENTERPRISE', 100000, 1000, 365)
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Add subscriptionId column to user table as NULLABLE first
ALTER TABLE "user" ADD COLUMN "subscriptionId" text;
--> statement-breakpoint
-- Assign 'FREE' subscription to existing users who don't have a subscriptionId yet
UPDATE "user"
SET "subscriptionId" = 'free'
WHERE "subscriptionId" IS NULL;
--> statement-breakpoint
-- Now make the column NOT NULL after populating it
ALTER TABLE "user" ALTER COLUMN "subscriptionId" SET NOT NULL;
--> statement-breakpoint
-- Add foreign key constraint for subscriptionId
ALTER TABLE "user"
ADD CONSTRAINT "user_subscriptionId_subscriptions_id_fk"
FOREIGN KEY ("subscriptionId")
REFERENCES "public"."subscriptions"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;