CREATE TABLE IF NOT EXISTS "bot" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"botName" text,
	"botEmail" text,
	"botHd" text,
	"botPicture" text,
	"accessToken" text,
	"refreshToken" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bot" ADD CONSTRAINT "bot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
