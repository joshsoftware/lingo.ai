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
    <div className="flex flex-col overflow-y-hidden gap-8 w-full h-full justify-center items-center">
      <div className="flex flex-col md:flex-row w-full justify-between gap-4">
        <div className="flex w-full flex-col md:flex-row justify-between items-center max-w-sm md:max-w-md gap-2 bg-[#F0FFFA] rounded-sm p-4">
          <h1 className="text-xl font-bold">{transcription.documentName}</h1>
          <h1>
            {transcription.createdAt
              ? format(
                  new Date(transcription.createdAt),
                  "dd MMM yyyy | hh:mm a",
                )
              : "N/A"}
          </h1>
        </div>
        <div className="flex flex-col gap-2 justify-center items-center">
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
          {audioDuration ? `Duration: ${audioDuration}` : "Loading..."}
        </div>
      </div>

      <div className="flex flex-col w-full gap-4 justify-center items-start">
        <div className="flex flex-col w-full gap-2 justify-start items-start">
          <h1 className="text-xl font-bold">Translation</h1>
          <Card className="w-full max-w-xs md:max-w-full overflow-y-auto p-4 rounded-lg h-36">
            {transcription.translation || "No translation available"}
          </Card>
        </div>
        <div className="flex flex-col w-full gap-2 justify-start items-start">
          <h1 className="text-xl font-bold">Summary</h1>
          <Card className="w-full max-w-xs md:max-w-full overflow-y-auto p-4 rounded-lg h-36">
            {transcription.summary || "No summary available"}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailedTranscription;
