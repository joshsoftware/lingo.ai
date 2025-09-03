export type userTranscriptions = {
  id: string;
  documentName: string;
  createdAt: Date | null;
  documentUrl: string;
  audioDuration: number | null;
  isDefault: boolean;
  detectedLanguage: string | null;
};

export type segment = {
  start: number;
  end: number;
  text: string;
}
