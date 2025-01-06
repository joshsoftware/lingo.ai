export type userTranscriptions = {
    id: string;
    documentName: string;
    createdAt: Date | null;
    documentUrl: string;
    audioDuration: number | null;
    isDefault: boolean;
  };

export type segment = {
  start: number;
  end: number;
  text: string;
}
