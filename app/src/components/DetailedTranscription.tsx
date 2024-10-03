"use client";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TranscriptionsType } from "@/db/schema";
import { PauseCircleIcon, PlayCircleIcon } from "lucide-react";
import { Card } from "./ui/card";
import { getAudioDuration } from "@/utils/recording";

interface DetailedTranscriptionProps {
  transcription: TranscriptionsType;
}

const DetailedTranscription = ({
  transcription,
}: DetailedTranscriptionProps) => {
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
    <div className="flex flex-col gap-8 w-full h-full">
      <div className="flex flex-col items-center md:flex-row w-full justify-between gap-8 xl:gap-4">
        <div className="flex w-full flex-col gap-1 max-sm:items-center max-w-sm md:max-w-md">
          <h1 className="text-xl font-bold m-0">{transcription.documentName}</h1>
          <p className="text-xs m-0">
            {transcription.createdAt
              ? format(
                  new Date(transcription.createdAt),
                  "dd MMM yyyy | hh:mm a",
                )
              : "N/A"}
          </p>
        </div>
        <div className="flex flex-col gap-1 justify-center items-center">
          <Button
            className="flex w-full gap-2 bg-[#668D7E] hover:bg-[#668D7E] text-white"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <PauseCircleIcon className="w-6 h-6" />
            ) : (
              <PlayCircleIcon className="w-6 h-6" />
            )}
            {isPlaying ? "Pause Audio" : "Play Audio"}
          </Button>
          <p className="text-xs m-0">{audioDuration ? `Duration: ${audioDuration}` : "Loading..."}</p>
        </div>
      </div>

      <div className="flex flex-1 max-sm:flex-col w-full gap-4 justify-center items-start mb-8 xl:overflow-y-auto">
        <div className="flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto">
          <h1 className="text-xl font-bold">Translation</h1>
          <Card className="flex-1 w-full max-w-xs md:max-w-full xl:overflow-y-auto p-4 rounded-lg">
            {transcription.translation || "No translation available"}
          </Card>
        </div>
        <div className="flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto">
          <h1 className="text-xl font-bold">Summary</h1>
          <Card className="w-full flex-1 max-w-xs md:max-w-full xl:overflow-y-auto p-4 rounded-lg">
            {transcription.summary || "No summary available"}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailedTranscription;
