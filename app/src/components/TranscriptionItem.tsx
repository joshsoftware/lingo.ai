"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { userTranscriptions } from "@/types/transcriptions";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import TranscriptionSkeleton from "./TranscriptionSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileAudio } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { getAudioDuration } from "@/utils/recording";
import TranscriptionRow from "./TranscriptionCard";

interface TranscriptionItemProps {
  initialTranscriptionsData: userTranscriptions[];
  userId: string | null;
}

const TranscriptionItem = (props: TranscriptionItemProps) => {
  const { initialTranscriptionsData, userId } = props;

  const [defaultTranscriptionFilter, setDefaultTranscriptionFilter] =
    useState<string>("true");
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTranscriptions(
      initialTranscriptionsData,
      defaultTranscriptionFilter,
      userId
    );

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
    setCurrentPlayingIndex(null);
  };

  const filteredTranscriptions =
    data?.pages?.flatMap(
      (page: { transcriptions: userTranscriptions[] }) => page.transcriptions
    ) || [];

  console.log(
    "filteredTranscriptions....",
    data?.pages,
    data?.pages[0]?.documentName,
    data?.pages
  );
  
  return (
    <div>
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Audio Recordings</h1>
          <p className="text-muted-foreground">
            Manage and play your uploaded audio recordings
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <TranscriptionSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                All Recordings ({filteredTranscriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Upload Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranscriptions.map((transcription, idx) => (
                    <TranscriptionRow
                      key={transcription?.id}
                      transcription={transcription}
                      index={idx}
                      isPlaying={currentPlayingIndex === idx}
                      onPlayPause={() => handlePlayPause(idx)}
                      onAudioEnd={handleAudioEnd}
                      rowRef={
                        idx === filteredTranscriptions.length - 1
                          ? lastItemRef
                          : undefined
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
      {isFetchingNextPage &&
        Array.from({ length: 2 }).map((_, idx) => (
          <TranscriptionSkeleton key={idx} />
        ))}
    </div>
  );
};

export default TranscriptionItem;
