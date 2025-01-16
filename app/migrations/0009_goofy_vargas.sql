DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('pending', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "analysis_feedback" RENAME COLUMN "impact" TO "feedback_message";--> statement-breakpoint
ALTER TABLE "analysis_feedback" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "registrations" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "interview_analysis" ALTER COLUMN "status" SET DATA TYPE status;--> statement-breakpoint
ALTER TABLE "interview_analysis" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "interview_analysis" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "analysis_feedback" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "interview_analysis" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp DEFAULT now();