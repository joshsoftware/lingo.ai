CREATE TABLE IF NOT EXISTS "registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"userName" text NOT NULL,
	"userEmail" text NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registrationId" text NOT NULL,
	"transcription" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"documentUrl" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcriptions" ADD CONSTRAINT "transcriptions_registrationId_registrations_id_fk" FOREIGN KEY ("registrationId") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
