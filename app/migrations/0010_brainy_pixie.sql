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

-- Add subscriptionId column to user table
ALTER TABLE "user" ADD COLUMN "subscriptionId" text NOT NULL;
--> statement-breakpoint

-- Add foreign key constraint for subscriptionId
DO $$ BEGIN
	ALTER TABLE "user"
	ADD CONSTRAINT "user_subscriptionId_subscriptions_id_fk"
	FOREIGN KEY ("subscriptionId")
	REFERENCES "public"."subscriptions"("id")
	ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- Ensure pgcrypto extension is enabled for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint

-- Insert default subscription plans if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "subscriptions" WHERE name = 'FREE') THEN
    INSERT INTO "subscriptions" ("id", "name", "recordingCount", "fileSizeLimitMB", "durationDays")
    VALUES
      (gen_random_uuid(), 'FREE', 2, 20, 30),
      (gen_random_uuid(), 'BASIC', 4, 100, 90),
      (gen_random_uuid(), 'ENTERPRISE', 100000, 1000, 365);
  END IF;
END $$;
--> statement-breakpoint

-- Assign 'FREE' subscription to existing users who don’t have a subscriptionId yet
DO $$
DECLARE
  free_id UUID;
BEGIN
  SELECT id INTO free_id FROM "subscriptions" WHERE name = 'FREE';

  UPDATE "user"
  SET "subscriptionId" = free_id
  WHERE "subscriptionId" IS NULL;
END $$;
