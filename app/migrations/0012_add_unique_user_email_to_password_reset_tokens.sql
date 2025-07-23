ALTER TABLE "password_reset_tokens"
ADD CONSTRAINT "password_reset_tokens_user_email_unique" UNIQUE ("user_email"); 