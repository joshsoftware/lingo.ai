CREATE TABLE IF NOT EXISTS "analysis_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"analysis_id" uuid NOT NULL,
	"is_found_useful" boolean NOT NULL,
	"impact" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"candidate_name" text NOT NULL,
	"interviewer_name" text NOT NULL,
	"interview_recording_link" text NOT NULL,
	"job_description_document_link" text NOT NULL,
	"transcript" text,
	"questions_answers" text,
	"parsed_job_description" text,
	"analysis_result" text,
	"conversation" text,
	"status" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"userName" text NOT NULL,
	"userEmail" text NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"translation" text NOT NULL,
	"summary" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"documentUrl" text NOT NULL,
	"documentName" text NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"audioDuration" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"contactNumber" text,
	"role" text,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysis_feedback" ADD CONSTRAINT "analysis_feedback_analysis_id_interview_analysis_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."interview_analysis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_analysis" ADD CONSTRAINT "interview_analysis_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcriptions" ADD CONSTRAINT "transcriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
