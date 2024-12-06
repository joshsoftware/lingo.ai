CREATE TABLE IF NOT EXISTS "analysis_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"analysis_id" text NOT NULL,
	"is_found_useful" boolean NOT NULL,
	"impact" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_analysis" (
	"id" text PRIMARY KEY NOT NULL,
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
