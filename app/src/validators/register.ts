import { ValidationMessage } from "@/constants/messages";
import { z } from "zod";

export const signupUserSchema = z.object({
  userEmail: z.string().email({
    message: ValidationMessage.INVALID_EMAIL,
  }),
  password: z
    .string()
    .min(8, {
      message: ValidationMessage.PASSWORD_MIN_LENGTH,
    })
    .max(16, {
      message: ValidationMessage.PASSWORD_MAX_LENGTH,
    }),
  userName: z.string().min(2, {
    message: ValidationMessage.NAME_MIN_LENGTH,
  }),
  contact: z.string().regex(/^\d{10}$/, {
    message: ValidationMessage.CONTACT_FORMAT,
  }),
});

export const signinUserSchema = z.object({
  userEmail: z.string().email({
    message: ValidationMessage.INVALID_EMAIL,
  }),
  password: z
    .string()
    .min(8, {
      message: ValidationMessage.PASSWORD_MIN_LENGTH,
    })
    .max(16, {
      message: ValidationMessage.PASSWORD_MAX_LENGTH,
    }),
});

export type SignupUserRequest = z.infer<typeof signupUserSchema>;
export type SigninUserRequest = z.infer<typeof signinUserSchema>;
