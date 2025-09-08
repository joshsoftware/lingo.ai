"use client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileAudio,
  FileText,
  Database,
  PlayCircleIcon,
  PauseCircleIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";

interface CRMRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  lastContact: string;
  location: string;
  leadSource: string;
  recordingUrl: string;
  recordingName: string;
  translation: string;
  extraction: {
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
    keyPoints: string[];
    actionItems: string[];
  };
}

const DetailedCRM = ({ crmRecord }: { crmRecord: CRMRecord }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "prospect":
        return "secondary";
      case "qualified":
        return "outline";
      case "closed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getProxyUrl = (audioUrl: string): string => {
    if (audioUrl.includes('.s3.') || audioUrl.includes('s3.amazonaws.com')) {
      return `/api/proxy?url=${encodeURIComponent(audioUrl)}`;
    }
    return audioUrl;
  };

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (crmRecord.recordingUrl) {
      const proxyUrl = getProxyUrl(crmRecord.recordingUrl);
      const audio = new Audio(proxyUrl);
      audioRef.current = audio;

      const handleLoadedMetadata = () => {
        setAudioDuration(formatDuration(audio.duration));
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
        audio.pause();
      };
    }
  }, [crmRecord.recordingUrl]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto px-4">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">CRM Record Details</h1>
        <p className="text-muted-foreground">
          View and analyze customer relationship data and call recordings
        </p>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* CRM Info Section */}
        <div className="w-full">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                CRM Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                {/* Left Column - Contact Info */}
                <div className="flex-1 min-w-[300px] space-y-3">
                  <h4 className="font-semibold text-sm mb-3">Contact Information</h4>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{crmRecord.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{crmRecord.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{crmRecord.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{crmRecord.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{crmRecord.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{crmRecord.lastContact}</span>
                  </div>
                </div>

                {/* Right Column - Status, Lead Source & Audio */}
                <div className="flex-1 min-w-[300px] space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Status & Source</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={getStatusBadgeVariant(crmRecord.status)}>
                          {crmRecord.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Lead Source:</span>
                        <span className="text-sm text-muted-foreground">{crmRecord.leadSource}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Recording</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <FileAudio className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{crmRecord.recordingName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      Duration: {audioDuration || "Loading..."}
                    </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="flex flex-col flex-1 min-h-0 w-full">
          <Tabs defaultValue="translation" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="translation"
                className="flex items-center gap-2 duration-300 data-[state=active]:bg-[#668D7E] data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                Translation
              </TabsTrigger>
              <TabsTrigger
                value="extraction"
                className="flex items-center gap-2 data-[state=active]:bg-[#668D7E] data-[state=active]:text-white"
              >
                <Database className="h-4 w-4" />
                Extraction View
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Translation Tab */}
              <TabsContent value="translation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Call Translation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <Markdown>{crmRecord.translation}</Markdown>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Extraction View Tab */}
              <TabsContent value="extraction" className="space-y-4">
                <div className="grid gap-4">
                  {/* Entities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Extracted Entities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {crmRecord.extraction.entities.map((entity, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <span className="font-medium">{entity.value}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({entity.type})
                              </span>
                            </div>
                            <Badge variant="outline">
                              {Math.round(entity.confidence * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Points */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Key Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {crmRecord.extraction.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span className="text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Action Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Action Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {crmRecord.extraction.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DetailedCRM;
