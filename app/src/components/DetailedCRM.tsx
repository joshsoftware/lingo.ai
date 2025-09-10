"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileAudio,
  FileText,
  Database,
  PlayCircleIcon,
  PauseCircleIcon,
  User,
  Mail,
  Calendar,
  Building,
  ExternalLink,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, memo } from "react";
import Markdown from "react-markdown";
import { CRM_CONSTANTS } from "@/constants/crm";

interface CRMRecord {
  id: string;
  leadId: string;
  crmUrl: string;
  fileName: string;
  contact: string;
  email: string;
  company: string;
  lastContact: string;
  documentUrl: string;
  translation: string;
}

const DetailedCRM = memo(({ crmRecord }: { crmRecord: CRMRecord }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

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
    if (crmRecord.documentUrl) {
      const proxyUrl = getProxyUrl(crmRecord.documentUrl);
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
  }, [crmRecord.documentUrl]);

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
        <h1 className="text-3xl font-bold mb-2">{CRM_CONSTANTS.UI.DETAILS_TITLE}</h1>
        <p className="text-muted-foreground">
          {CRM_CONSTANTS.UI.DETAILS_SUBTITLE}
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
                    <span className="font-medium">{crmRecord.contact}</span>
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
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{crmRecord.lastContact}</span>
                  </div>
                </div>

                {/* Right Column - Lead Info & Audio */}
                <div className="flex-1 min-w-[300px] space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Lead Information</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">Lead ID:</span>
                        <span className="text-sm text-muted-foreground ml-2">{crmRecord.leadId}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">File Name:</span>
                        <span className="text-sm text-muted-foreground ml-2">{crmRecord.fileName}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">CRM URL:</span>
                        <a 
                          href={crmRecord.crmUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1 ml-2"
                        >
                          View in CRM
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Recording</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <FileAudio className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{crmRecord.fileName}</span>
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

        {/* Translation Section */}
        <div className="flex flex-col flex-1 min-h-0 w-full">
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
        </div>
      </div>
    </div>
  );
});

DetailedCRM.displayName = 'DetailedCRM';

export default DetailedCRM;