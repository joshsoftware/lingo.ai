import { z } from "zod";

export const adminCredentialsSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }).trim(),
  password: z.string().min(1, { message: "Password is required" }),
});

export type AdminCredentialsRequest = z.infer<typeof adminCredentialsSchema>;
