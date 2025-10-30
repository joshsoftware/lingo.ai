"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { userTranscriptions } from "@/types/transcriptions";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import TranscriptionSkeleton from "./TranscriptionSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileAudio } from "lucide-react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "./ui/table";
import TranscriptionRow from "./TranscriptionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { API } from "@/lib/axios";
import { Button } from "./ui/button";

interface TranscriptionItemProps {
  initialTranscriptionsData: userTranscriptions[];
  userId: string | null;
  userRole: string | null;
}

const TranscriptionItem = (props: TranscriptionItemProps) => {
  const { initialTranscriptionsData, userId, userRole } = props;

  const [defaultTranscriptionFilter, setDefaultTranscriptionFilter] =
    useState<string>(userId ? "user" : "true");
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
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

  const handleDeleteRecording = async (recordingId: String) => {
    try {
      const confirmDelete = confirm(
        "Are you sure you want to delete this recording?"
      );
      if (!confirmDelete) return;

      await API.delete(`/admin/transcriptions/${recordingId}`);
      refetch();
      toast.success("Recording deleted successfully");
    } catch (error) {
      console.error("Failed to delete recording:", error);
      toast.error("Failed to delete recording");
    }
  };

  const handleMakeDefault = async (recordingId: String) => {
    console.log("Make default clicked for recording ID:", recordingId);
    // try {
    //   await API.post(`/admin/transcriptions/${recordingId}/make-default`);
    //   refetch();
    //   toast.success("Recording set as default successfully");
    // } catch (error) {
    //   console.error("Failed to set recording as default:", error);
    //   toast.error("Failed to set recording as default");
    // }
  };

  console.log("Filtered Transcriptions:", filteredTranscriptions);

  return (
    <div>
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-7xl">
        <div className="overflow-clip flex w-full max-w-xs  ml-auto">
          {userId && (
            <Select
              value={defaultTranscriptionFilter}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="focus:outline-none focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Filter transcriptions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">My records</SelectItem>
                <SelectItem value="true">Sample records</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <TranscriptionSkeleton key={idx} />
            ))}
          </div>
        ) : filteredTranscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-6 mt-8">
            <p className="text-2xl">No transcriptions found</p>
            <button
              className="mt-4 px-4 py-2 bg-[#668D7E] text-black rounded text-base"
              onClick={() => (window.location.href = "/new")}
            >
              Click here to try new one
            </button>
          </div>
        ) : (
          <>
            <div className="flex">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Audio Recordings</h1>
                <p className="text-muted-foreground">
                  Manage and play your uploaded audio recordings
                </p>
              </div>
              <div className="ml-auto mt-3">
                {userRole === "ADMIN" && (
                  <Button
                    variant={"greenTheme"}
                    onClick={() => (window.location.href = "/new")}
                  >
                    Add Sample Recording
                  </Button>
                )}
              </div>
            </div>
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
                      {userRole === "ADMIN" && (
                        <TableHead className="w-12">Sample</TableHead>
                      )}
                      <TableHead className="w-12"></TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Upload Date</TableHead>
                      {userRole === "ADMIN" && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTranscriptions.map((transcription, idx) => (
                      <TranscriptionRow
                        key={idx}
                        transcription={transcription}
                        isPlaying={currentPlayingIndex === idx}
                        onPlayPause={() => handlePlayPause(idx)}
                        onAudioEnd={handleAudioEnd}
                        rowRef={
                          idx === filteredTranscriptions.length - 1
                            ? lastItemRef
                            : undefined
                        }
                        onDelete={() => handleDeleteRecording(transcription.id)}
                        onToggleDefault={() =>
                          handleMakeDefault(transcription.id)
                        }
                        userRole={userRole}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
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
