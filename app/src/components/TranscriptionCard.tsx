"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileAudio, Pause, Play, Trash2 } from "lucide-react"; // Added Trash icon
import Link from "next/link";
import { getAudioDuration, getFileSize } from "@/utils/recording";
import { userTranscriptions } from "@/types/transcriptions";

interface TranscriptionRowProps {
  transcription: userTranscriptions;
  isPlaying: boolean;
  userRole: string | null;
  onPlayPause: () => void;
  onAudioEnd: () => void;
  onDelete?: () => void;
  onToggleDefault?: (checked: boolean) => void;
  rowRef?: (node: HTMLTableRowElement | null) => void;
}

const TranscriptionRow = ({
  transcription,
  isPlaying,
  userRole,
  onPlayPause,
  onAudioEnd,
  onDelete,
  onToggleDefault,
  rowRef,
}: TranscriptionRowProps) => {
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAudioDuration = async () => {
      if (transcription?.documentUrl) {
        const duration = await getAudioDuration(transcription.documentUrl);
        setAudioDuration(duration);
      }
    };

    const fetchFileSize = async () => {
      if (transcription?.documentUrl) {
        const size = await getFileSize(transcription.documentUrl);
        setFileSize(size);
      }
    };

    fetchAudioDuration();
    fetchFileSize();

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
      {userRole === "ADMIN" && (
        <td className="py-3 px-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={transcription?.isDefault}
            onChange={(e) => {
              if (onToggleDefault) onToggleDefault(e.target.checked);
            }}
          />
        </td>
      )}
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
        <div className="ml-4">{fileSize ? fileSize : "Loading..."}</div>
      </td>
      <td>
        <Badge className="ml-4" variant="secondary">
          {/* TODO: Add language from microservice */}
          {"N/A"}
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

      {userRole === "ADMIN" && (
        <td className="py-3 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-8 h-8 p-2 rounded-full flex items-center justify-center shadow-xl hover:bg-red-500 cursor-pointer hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </td>
      )}
    </tr>
  );
};

export default TranscriptionRow;
