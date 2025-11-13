CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_username_unique" UNIQUE("username")
);
