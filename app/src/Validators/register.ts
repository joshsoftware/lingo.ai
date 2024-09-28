import { z } from "zod";

export const registerUserSchema = z.object({
  userEmail: z.string().email(),
  password: z.string().min(8).max(16),
});

export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
