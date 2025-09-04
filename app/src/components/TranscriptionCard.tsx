"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileAudio, Pause, Play } from "lucide-react";
import Link from "next/link";
import { getAudioDuration, getFileSize } from "@/utils/recording";
import { userTranscriptions } from "@/types/transcriptions";
import { LanguageDisplay } from "./LanguageDisplay";

interface TranscriptionRowProps {
  transcription: userTranscriptions;
  index: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onAudioEnd: () => void;
  rowRef?: (node: HTMLTableRowElement | null) => void;
}

const TranscriptionRow = ({
  transcription,
  index,
  isPlaying,
  onPlayPause,
  onAudioEnd,
  rowRef,
}: TranscriptionRowProps) => {
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const getProxyUrl = (audioUrl: string): string => {
    if (audioUrl.includes('.s3.') || audioUrl.includes('s3.amazonaws.com')) {
      return `/api/proxy?url=${encodeURIComponent(audioUrl)}`;
    }
    return audioUrl;
  };

  useEffect(() => {
    const fetchAudioDuration = async () => {
      if (transcription?.documentUrl) {
      
        if (transcription.audioDuration && transcription.audioDuration > 0) {
          const minutes = Math.floor(transcription.audioDuration / 60);
          const seconds = transcription.audioDuration % 60;
          const formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
          setAudioDuration(formattedDuration);
        } else {
         
          const duration = await getAudioDuration(transcription.documentUrl);
          setAudioDuration(duration);
        }
      }
    };

    const fetchFileSize = async () => {
      if (transcription?.documentUrl) {
        const size = await getFileSize(transcription.documentUrl);
        setFileSize(size);
      }
    };

    const setupAudio = () => {
      if (transcription?.documentUrl) {
        
        const proxyUrl = getProxyUrl(transcription.documentUrl);
        
        const audio = new Audio(proxyUrl);
        audioRef.current = audio;

        audio.addEventListener("ended", () => {
          if (audioRef.current) {
            audioRef.current.pause();
            onAudioEnd();
          }
        });
      }
    };

    fetchAudioDuration();
    fetchFileSize();
    setupAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [transcription?.documentUrl, onAudioEnd]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <tr className="border-b border-gray-200 mt-4" ref={rowRef}>
      <td className="py-3 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPlayPause}
          className="h-8 w-8 p-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-green-500" />
          ) : (
            <Play className="h-4 w-4 text-green-500" />
          )}
        </Button>
      </td>
      <td>
        <Link href={`/transcriptions/${transcription?.id}`}>
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{transcription?.documentName}</span>
          </div>
        </Link>
      </td>
      <td className="text-muted-foreground ">
        <div className="ml-4">
          {fileSize ? fileSize : "Loading..."}
        </div>
      </td>
      <td>
        <div className="ml-4">
          <LanguageDisplay languageCode={transcription?.detectedLanguage || undefined} />
        </div>
      </td>
      <td className="font-mono text-sm">
        {audioDuration ? `Duration: ${audioDuration}` : "Loading..."}
      </td>
      <td className="text-muted-foreground ">
        {transcription?.createdAt
          ? format(new Date(transcription.createdAt), "dd MMM yyyy | hh:mm a")
          : "N/A"}
      </td>
    </tr>
  );
};

export default TranscriptionRow;
