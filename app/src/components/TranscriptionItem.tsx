"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TranscriptionCard from "./TranscriptionCard";
import { userTranscriptions } from "@/types/transcriptions";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import TranscriptionSkeleton from "./TranscriptionSkeleton";

interface TranscriptionItemProps {
  initialTranscriptionsData: userTranscriptions[];
}

const TranscriptionItem = (props: TranscriptionItemProps) => {
  const { initialTranscriptionsData } = props;

  const [defaultTranscriptionFilter, setDefaultTranscriptionFilter] = useState<string>("false");
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useTranscriptions(initialTranscriptionsData, defaultTranscriptionFilter);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    if (data) {
      setIsLoading(false);
    }
  }, [data]);

  const handlePlayPause = (index: number) => {
    if (currentPlayingIndex === index) {
      setCurrentPlayingIndex(null);
    } else {
      setCurrentPlayingIndex(index);
    }
  };

  const handleAudioEnd = () => {
    setCurrentPlayingIndex(null);
  };

  const handleFilterChange = (value: string) => {
    setDefaultTranscriptionFilter(value);
    setCurrentPlayingIndex(null); // Reset currentPlayingIndex when filter changes
  };

  const filteredTranscriptions = data?.pages?.flatMap((page: { transcriptions: userTranscriptions[] }) =>
    page.transcriptions
  ) || [];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="overflow-hidden flex w-full max-w-xs min-h-14 ml-auto">
        <Select onValueChange={handleFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter transcriptions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Demo Transcriptions</SelectItem>
            <SelectItem value="false">Recent Transcriptions</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto max-h-54">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <TranscriptionSkeleton key={idx}/>
          ))
        ) : (
          filteredTranscriptions.map((transcription: userTranscriptions, idx: number) => (
            <TranscriptionCard
              key={idx}
              transcription={transcription}
              index={idx}
              isPlaying={currentPlayingIndex === idx}
              onPlayPause={() => handlePlayPause(idx)}
              onAudioEnd={handleAudioEnd}
              ref={idx === filteredTranscriptions.length - 1 ? lastItemRef : null}
            />
          ))
        )}
        {isFetchingNextPage && (
          Array.from({ length: 2 }).map((_, idx) => (
            <TranscriptionSkeleton key={idx}/>
          ))
        )}
      </div>
    </div>
  );
};

export default TranscriptionItem;