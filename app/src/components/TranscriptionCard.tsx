"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileAudio, Pause, Play } from "lucide-react";
import Link from "next/link";
import { getAudioDuration } from "@/utils/recording";
import { userTranscriptions } from "@/types/transcriptions";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAudioDuration = async () => {
      if (transcription?.documentUrl) {
        const duration = await getAudioDuration(transcription.documentUrl);
        setAudioDuration(duration);
      }
    };

    fetchAudioDuration();

    if (transcription?.documentUrl) {
      const audio = new Audio(transcription.documentUrl);
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        if (audioRef.current) {
          audioRef.current.pause();
          onAudioEnd();
        }
      });

      if (isPlaying) {
        audio.play();
      } else {
        audio.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [transcription?.documentUrl, onAudioEnd, isPlaying]);

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
          {transcription?.fileSize ? transcription?.fileSize : "N/A"}
        </div>
      </td>
      <td>
        <Badge className="ml-4" variant="secondary">
          {transcription?.language ? transcription?.language : "N/A"}
        </Badge>
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
