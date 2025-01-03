import { segment } from "./transcriptions";

export type TranscriptionResponse = {
  message: string;
  translation: string;
  summary: string;
  segments: segment[];
};
