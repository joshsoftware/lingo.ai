import { z } from "zod";

export const signupUserSchema = z.object({
  userEmail: z.string().email({
    message: "Invalid email",
  }),
  password: z.string().min(8, {
    message: "Password must be atleast 8 characters long"
  }).max(16, {
    message: "Password must be atmost 16 characters long"
  }),
  userName: z.string().min(2, {
    message: "Name should be atleast 2 characters long"
  }),
  contact: z.string().regex(/^\d{10}$/, {
    message: "Contact number must be exactly 10 digits"
  })

});

export const aiCruitRequestSchema = z.object({
  interview_link: z.string().url({
    message: "Invalid URL format for the interview link",
  }),
  job_description_link: z.string().url({
    message: "Invalid URL format for the job description link",
  }),
  candidate_name: z.string().min(2, {
    message: "Candidate Name should be at least 2 characters long",
  }),
  interviewer_name: z.string().min(2, {
    message: "Interviewer Name should be at least 2 characters long",
  }),
});


export const signinUserSchema = z.object({
  userEmail: z.string().email({
    message: "Invalid email",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }).max(16, {
    message: "Password must be at most 16 characters long",
  }),
});

export type AiCruitRequest = z.infer<typeof aiCruitRequestSchema>;
export type SignupUserRequest = z.infer<typeof signupUserSchema>;
export type SigninUserRequest = z.infer<typeof signinUserSchema>;
export type AiCruitRequest = z.infer<typeof aiCruitRequestSchema>;