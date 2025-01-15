import { z } from "zod";

export const signupUserSchemaValidator = z.object({
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

export const aiCruitRequestSchemaValidator = z.object({
  interview_link: z.string().url({
    message: "Invalid URL format for the interview link",
  }).optional(),
  interview_transcript: z.string().url({
    message: "Invalid URL format for the interview transcript",
  }).optional(),
  transcript_file: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size > 0, {
      message: "File is required when not providing a transcript URL",
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


export type AiCruitRequest = z.infer<typeof aiCruitRequestSchemaValidator>;
export type SignupUserRequest = z.infer<typeof signupUserSchemaValidator>;
export type SigninUserRequest = z.infer<typeof signinUserSchemaValidator>;