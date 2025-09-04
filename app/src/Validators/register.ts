import { z } from "zod";
import { validationMessages as msg } from "@/constants/validationMessages";

export const signupUserSchema = z.object({
  userEmail: z.string()
    .min(1, { message: msg.email.required })
    .email({ message: msg.email.invalid }),
  password: z.string()
    .min(1, { message: msg.password.required })
    .min(8, { message: msg.password.min })
    .max(16, { message: msg.password.max }),
  userName: z.string()
    .min(1, { message: msg.name.required })
    .min(2, { message: msg.name.min }),
  contact: z.string()
    .min(1, { message: msg.contact.required })
    .regex(/^\d{10}$/, { message: msg.contact.invalid }),
});

export const signinUserSchema = z.object({
  userEmail: z.string()
    .min(1, { message: msg.email.required })
    .email({ message: msg.email.invalid }),
  password: z.string()
    .min(1, { message: msg.password.required })
    .min(8, { message: msg.password.min })
    .max(16, { message: msg.password.max }),
});

export type SignupUserRequest = z.infer<typeof signupUserSchema>;
export type SigninUserRequest = z.infer<typeof signinUserSchema>;
