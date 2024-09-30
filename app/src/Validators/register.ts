import { z } from "zod";

export const registerUserSchema = z.object({
  userEmail: z.string().email({
    message: "Invalid email",
  }),
  password: z.string().min(8, {
    message: "Password must be atleast 8 characters long"
  }).max(16, {
    message: "Password must be atmost 16 characters long"
  }),
});

export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
