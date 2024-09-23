"use client";
import { TranscriptionsType } from "@/db/schema";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { PauseCircleIcon, PlayCircleIcon } from "lucide-react";
import { getAudioDuration } from "@/utils/recording";

interface TranscriptionItemProps {
  transcription: Pick<
    TranscriptionsType,
    "id" | "documentName" | "createdAt" | "documentUrl"
  >;
  index: number;
}

const TranscriptionItem = (props: TranscriptionItemProps) => {
  const { transcription, index } = props;

  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAudioDuration = async () => {
      if (transcription.documentUrl) {
        const duration = await getAudioDuration(transcription.documentUrl);
        setAudioDuration(duration);
      }
    };

    fetchAudioDuration();
    // Create audio element and set ref
    if (transcription.documentUrl) {
      const audio = new Audio(transcription.documentUrl);
      audioRef.current = audio;
    }

    // Cleanup function to stop audio playback when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [transcription.documentUrl]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      key={index}
      className="flex flex-col md:flex-row gap-4 w-full h-full bg-[#F9F9F9] p-2 px-8 rounded-xl justify-between items-center"
    >
      <Link
        className="flex-1 h-fit w-full"
        href={`/transcriptions/${transcription.id}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="w-full md:w-1/3 overflow-hidden text-ellipsis whitespace-nowrap">
            {index + 1} {transcription.documentName}
          </h1>
          <h1 className="w-full md:w-1/3 overflow-hidden text-ellipsis whitespace-nowrap">
            {transcription.createdAt
              ? format(
                  new Date(transcription.createdAt),
                  "dd MMM yyyy | hh:mm a",
                )
              : "N/A"}
          </h1>
          <h1 className="w-full md:w-1/3 overflow-hidden text-ellipsis whitespace-nowrap">
            {audioDuration ? `Duration: ${audioDuration}` : "Loading..."}
          </h1>
        </div>
      </Link>
      <div className="flex flex-col gap-2 justify-center items-center w-full h-full md:w-auto z-10">
        <Button
          className="flex gap-2 bg-[#668D7E] hover:bg-[#668D7E] text-white"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <PauseCircleIcon className="w-6 h-6" />
          ) : (
            <PlayCircleIcon className="w-6 h-6" />
          )}
          {isPlaying ? "Pause Audio" : "Play Audio"}
        </Button>
      </div>
    </div>
  );
};

export default TranscriptionItem;
