import { segment } from "./transcriptions";

export type TranscriptionResponse = {
  message: string;
  translation: string;
  summary: string;
  segments: segment[];
  detected_language: string;
  leadId?: string;
  crmUrl?: string;
  extractedData?: any;
  isDefault?: boolean;
  transcriptionId?: string | null;
};
