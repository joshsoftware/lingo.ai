import { z } from "zod";

export const transcribeDocumentSchema = z.object({
  documentUrl: z.string().url(),
  documentName: z.string(),
});

export type TranscribeDocumentRequest = z.infer<
  typeof transcribeDocumentSchema
>;
