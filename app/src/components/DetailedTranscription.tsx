"use client";
import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TranscriptionsType } from "@/db/schema";
import { PauseCircleIcon, PlayCircleIcon } from "lucide-react";
import { Card } from "./ui/card";
import { getAudioDuration } from "@/utils/recording";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { primaryFont } from "@/fonts";

interface DetailedTranscriptionProps {
  transcription: TranscriptionsType;
}

const DetailedTranscription = ({
  transcription,
}: DetailedTranscriptionProps) => {
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);

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

    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
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

  const jumpToTime = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        if (!isPlaying) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    },
    [isPlaying]
  );

  return (
    <div className="flex flex-col gap-8 w-full h-full">
      <div className="flex flex-col items-center md:flex-row w-full justify-between gap-8 xl:gap-4">
        <div className="flex w-full flex-col gap-1 max-sm:items-center max-w-sm md:max-w-md">
          <h1 className="text-xl font-bold m-0">
            {transcription.documentName}
          </h1>
          <p className="text-xs m-0">
            {transcription.createdAt
              ? format(
                  new Date(transcription.createdAt),
                  "dd MMM yyyy | hh:mm a"
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
          <p className="text-xs m-0">
            {audioDuration ? `Duration: ${audioDuration}` : "Loading..."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 max-sm:flex-col  w-full gap-4 justify-center items-start mb-8 xl:overflow-y-auto">
        <div className="flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto">
          <div className="flex flex-1 w-full items-center justify-between">
            <h1 className="text-xl font-bold">
              {showTranslation ? "Translation" : "Timestamps"}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranslation(!showTranslation)}
              className="flex items-center gap-2 text-sm"
            >
              {showTranslation ? <>Show Timestamps</> : <>Show Translation</>}
            </Button>
          </div>
          <Card className="flex-1 w-full max-w-xs md:max-w-full xl:overflow-y-auto p-4 rounded-lg">
            {showTranslation ? (
              <Markdown className={cn("text-sm", primaryFont.className)}>
                {"```" + transcription.translation + "```" ||
                  "No translation available"}
              </Markdown>
            ) : (
              <div className="flex flex-col gap-3">
                {transcription.segments.length > 0
                  ? transcription.segments?.map((segment, index) => {
                      const formatTime = (time: number) => {
                        const minutes = Math.floor(time / 60);
                        const seconds = Math.floor(time % 60);
                        return `${minutes}:${String(seconds).padStart(2, "0")}`;
                      };

                      return (
                        <div
                          key={index}
                          className={cn(
                            "group flex items-start gap-4 p-3 rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm",
                            currentTime >= segment.start &&
                              currentTime <= segment.end &&
                              "bg-white border-l-4 border-green-500 shadow-sm"
                          )}
                          onClick={() => jumpToTime(segment.start)}
                        >
                          <div className="flex w-full flex-col gap-1">
                            <span className="text-xs font-mono text-gray-500">
                              {`${formatTime(segment.start)} - ${formatTime(
                                segment.end
                              )}`}
                            </span>
                            <div className="flex w-full justify-between">
                              <p className=" text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">
                                <Markdown>{segment.text}</Markdown>
                              </p>
                              <div className=" opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircleIcon className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : "No timestamps available"}
              </div>
            )}
          </Card>
        </div>
        <div className="flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto">
          <h1 className="text-xl font-bold">Summary</h1>
          <Card className="w-full flex-1 max-w-xs md:max-w-full xl:overflow-y-auto p-4 rounded-lg">
            <Markdown className={cn("text-sm", primaryFont.className)}>
              {"```" + transcription.summary + "```" || "No summary available"}
            </Markdown>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailedTranscription;
