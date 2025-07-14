import { z } from "zod";

export const signupUserSchema = z.object({
  userEmail: z.string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(16, { message: "Password must be at most 16 characters long" }),
  userName: z.string()
    .min(1, { message: "Name is required" })
    .min(2, { message: "Name should be at least 2 characters long" }),
  contact: z.string()
    .min(1, { message: "Contact number is required" })
    .regex(/^\d{10}$/, { message: "Contact number must be exactly 10 digits" })
});

export const signinUserSchema = z.object({
  userEmail: z.string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(16, { message: "Password must be at most 16 characters long" }),
});

export type SignupUserRequest = z.infer<typeof signupUserSchema>;
export type SigninUserRequest = z.infer<typeof signinUserSchema>;
