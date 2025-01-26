import { TranscriptionsType } from "@/db/schema";

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

export interface PageProps {
  params: {
    transcription_id: string;
  };
}

export interface CustomBarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string[];
      backgroundColor: string[];
      fill: boolean;
    }[];
  };
  maxY: number;
}

export interface DetailedTranscriptionProps {
  transcription: TranscriptionsType;
}

export interface feedBackProps {
  analysisId: string
}