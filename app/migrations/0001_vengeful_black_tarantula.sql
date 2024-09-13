ALTER TABLE "transcriptions" RENAME COLUMN "transcription" TO "translation";--> statement-breakpoint
ALTER TABLE "transcriptions" ADD COLUMN "summary" text NOT NULL;