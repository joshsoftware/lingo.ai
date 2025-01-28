import { z } from "zod";

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
  core_technology: z
  .string()
  .min(2, { message: "Core Technology should be selected" })
  .refine((val) => ["Java", "Python", "Ruby on rails", "Golang", "DevOps", "NodeJS", "React", "Angular"].includes(val), {
    message: "Please select a valid core technology",
  }),
});

export type AiCruitRequest = z.infer<typeof aiCruitRequestSchemaValidator>;
