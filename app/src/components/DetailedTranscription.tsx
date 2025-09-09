"use client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileAudio,
  FileText,
  List,
  PlayCircleIcon,
  PauseCircleIcon,
} from "lucide-react";
import { Key, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { LanguageDisplay } from "./LanguageDisplay";
import { useAudioMetadata } from "@/hooks/useAudioMetadata";
import { formatDuration } from "@/utils/recording";
import { getProxyUrl } from "@/utils/urlUtils";

const AudioResults = ({ transcription }: { transcription: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Use the optimized caching hook
  const { displayDuration, displayFileSize } = useAudioMetadata(transcription.documentUrl);
  
  const audioFile = {
    name: transcription.documentName,
    duration: displayDuration,
    fileSize: displayFileSize,
    uploadDate: format(new Date(transcription.createdAt), "dd MMM yyyy"),
    originalLanguage: transcription.detectedLanguage || null,
    url: transcription.documentUrl,
  };

  const translation = {
    text: transcription.translation,
    confidence: 95, // Or pull dynamically if available
  };

  const summary = {
    keyPoints: transcription.summary?.split("\n") || [],
    actionItems: [],
    participants: [],
  };


  useEffect(() => {
    if (audioFile.url) {
      const proxyUrl = getProxyUrl(audioFile.url);
      const audio = new Audio(proxyUrl);
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime || 0);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [audioFile.url]);
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
    []
  );
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-background py-8 w-full">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Audio Processing Results</h1>
          <p className="text-muted-foreground">
            Complete analysis of your uploaded audio file with translation and
            insights
          </p>
        </div>

        {/* Audio File Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              Audio File Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  File Name
                </p>
                <p className="font-medium">{audioFile.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duration
                </p>
                <Badge variant="secondary">{audioFile.duration}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  File Size
                </p>
                <Badge variant="secondary">{audioFile.fileSize}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Upload Date
                </p>
                <p className="font-medium">{audioFile.uploadDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Original Language
                </p>
                <LanguageDisplay languageCode={audioFile.originalLanguage} />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="greenTheme" size="sm" onClick={handlePlayPause}>
                {isPlaying ? (
                  <>
                    <PauseCircleIcon className="h-4 w-4 mr-2" />
                    Pause Audio
                  </>
                ) : (
                  <>
                    <PlayCircleIcon className="h-4 w-4 mr-2" />
                    Play Audio
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <div className="flex flex-col flex-1 min-h-0">
          <Tabs defaultValue="translation" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 ">
              <TabsTrigger
                value="translation"
                className="flex items-center gap-2 duration-300 data-[state=active]:bg-[#668D7E] data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                Translation
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex items-center gap-2 data-[state=active]:bg-[#668D7E] data-[state=active]:text-white"
              >
                <List className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="flex items-center gap-2 data-[state=active]:bg-[#668D7E] data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Translation Tab */}
              <TabsContent value="translation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      English Translation
                      <Badge variant="secondary">
                        {translation.confidence}% Confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-base leading-relaxed">
                        {translation.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversation Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="h-auto overflow-y-auto">
                    <div className="space-y-4">
                      {transcription.segments.length > 0
                        ? transcription.segments?.map(
                            (
                              segment: {
                                start: number;
                                end: number;
                                text: string;
                              },
                              index: Key | null | undefined
                            ) => {
                              const formatTime = (time: number) => {
                                return formatDuration(time);
                              };

                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "group flex items-start gap-4 p-3 rounded-md transition-all hover:cursor-pointer duration-100 hover:bg-green-100/50 border-1 hover:shadow-sm",
                                    currentTime >= segment.start &&
                                      currentTime <= segment.end &&
                                      "border bg-green-100/50  border-green-500 shadow-sm"
                                  )}
                                  onClick={() => jumpToTime(segment.start)}
                                >
                                  <div className="flex w-full flex-col gap-2">
                                    <span className="text-xs font-mono text-gray-500">
                                      {`${formatTime(
                                        segment.start
                                      )} - ${formatTime(segment.end)}`}
                                    </span>
                                    <div className="flex w-full justify-between">
                                      <div className=" text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">
                                        <Markdown className="text-sm">
                                          {"```" + segment.text + "```"}
                                        </Markdown>
                                      </div>
                                      {currentTime >= segment.start &&
                                      currentTime <= segment.end ? (
                                        <div className=" transition-opacity">
                                          {isPlaying ? (
                                            <PauseCircleIcon className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <PlayCircleIcon className="w-4 h-4 text-green-600" />
                                          )}
                                        </div>
                                      ) : (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                          <PlayCircleIcon className="w-4 h-4 text-green-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )
                        : "No timestamps available"}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Key Points */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {summary.keyPoints.map(
                          (point: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm">{point}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Action Items */}
                  {/* <Card>
                <CardHeader>
                  <CardTitle>Action Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.actionItems.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card> */}

                  {/* Participants */}
                  {/* <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {summary.participants.map(
                      (participant: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {participant}
                        </Badge>
                      )
                    )}
                  </div>
                </CardContent>
              </Card> */}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AudioResults;
