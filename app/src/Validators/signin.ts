import { z } from "zod";

export const signinUserSchemaValidator = z.object({
    userEmail: z.string().email({
      message: "Invalid email",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters long",
    }).max(16, {
      message: "Password must be at most 16 characters long",
    }),
  });

export type SigninUserRequest = z.infer<typeof signinUserSchemaValidator>;
