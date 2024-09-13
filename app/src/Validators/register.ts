import { z } from "zod";

export const registerUserSchema = z.object({
  userName: z.string().min(3).max(32),
  userEmail: z.string().email(),
});

export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
