import { z } from 'zod';

export const TranscriptionValidator = z.object({
    documentUrl: z.string(),
    transcription: z.string(),
})

export type TranscriptionRequest = z.infer<typeof TranscriptionValidator>;
