import { z } from "zod";

export const forgotPasswordSchema = z.object({
  userEmail: z.string().email({
    message: "Invalid email",
  }),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }).max(16, {
    message: "Password must be at most 16 characters long",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }).max(16, {
    message: "Password must be at most 16 characters long",
  }),
  token: z.string().optional(), // If your reset flow uses a token
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>; 