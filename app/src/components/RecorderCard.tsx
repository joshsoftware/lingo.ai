"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import {
  Loader2Icon,
  MicIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  SendIcon,
  UploadIcon,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useUploadThing } from "@/utils/uploadthing";
import { TranscribeDocumentRequest } from "@/Validators/document";
import { TranscriptionResponse } from "@/types/TranscriptionResponse";
import { TranscriptionsPayload, TranscriptionsType } from "@/db/schema";
import { Fragment } from "react";

interface RecorderCardProps {
  userId: string;
}
const RecorderCard = (props: RecorderCardProps) => {
  const { userId } = props;

  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setAudioURL(URL.createObjectURL(newFiles[0]));
    }
  };

  const handleFileError = (file: any) => {
    file.errors.forEach((error: any) => {
      switch (error.code) {
        case "file-too-large":
          toast.error(`File ${file.file.name} is too large`, {
            description: "Please upload a file less than 5MB",
          });
          break;
        case "file-invalid-type":
          toast.error(`File ${file.file.name} is invalid`, {
            description: "Please upload a valid audio or video file",
          });
          break;
        default:
          toast.error(`File ${file.file.name} encountered an error`, {
            description: error.message,
          });
          break;
      }
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(handleFileError);
      }
      handleFileChange(acceptedFiles);
    },
    accept: {
      "audio/*": [".mp3", ".wav"],
      "video/*": [".mp4"],
    },
    noDrag: true,
  });

  const { startUpload, isUploading } = useUploadThing("audioUploader", {
    onBeforeUploadBegin: (files: File[]) => files,
    onUploadProgress: (progress: number) => setUploadProgress(progress),
    onClientUploadComplete: (res) => {
      const { name, url } = res[0];
      sendTranscribeRequest({
        documentUrl: url,
        documentName: name,
      });
    },
    onUploadError: () => {
      toast.error(`Failed to upload ${file?.type}, please try again in some time`, {
        description: "If the issue persists, please contact support",
      });
      setFile(null);
      setAudioURL("");
      setAudioBlob(null);
      setIsPlaying(false);
      setUploadProgress(0);
    },
  });

  const { mutate: sendTranscribeRequest, isPending: isTranscribing } =
    useMutation({
      mutationKey: ["transcribe"],
      mutationFn: async (payload: TranscribeDocumentRequest) => {
        const response = await axios.post("/api/transcribe", payload);

        return response.data as TranscriptionResponse;
      },
      onSuccess: async (res, data) => {
        // reset all
        saveTranscribe({
          documentUrl: data.documentUrl,
          documentName: data.documentName,
          userID: userId,
          summary: res.summary,
          segments: res.segments,
          translation: res.translation,
        });

        setFile(null);
        setAudioURL("");
        setAudioBlob(null);
        setUploadProgress(0);
        setRecordingTime(0);


        toast.success(`${file?.type} transcribed successfully`);
      },
      onError: (error) => {
        // reset all
        setFile(null);
        setAudioURL("");
        setAudioBlob(null);
        setUploadProgress(0);
        setRecordingTime(0);

        return toast.error(
          `Failed to transcribe ${file?.type}, please try again in some time`,
          {
            description: error.message,
          },
        );
      },
    });

  const { mutate: saveTranscribe, isPending: isSavingTranscribe } = useMutation(
    {
      mutationKey: ["saveTranscribe"],
      mutationFn: async (data: TranscriptionsPayload) => {

        if(recordingTime > 0) {
          // recorded
          data.audioDuration = recordingTime;
        }
        else{
          // uploaded
          const audio = new Audio(data.documentUrl);
          await new Promise<void>((resolve) => {
            audio.onloadedmetadata = () => {
              data.audioDuration = Math.round(audio.duration);
              resolve();
            };
          });
        }
        const response = await axios.post("/api/transcribe/save", data);
        return response.data[0] as TranscriptionsType;
      },
      onSuccess: async (res) => {
        if (res.id) {
          router.push(`/transcriptions/${res.id}`);
        }
        return toast.success("Transcription saved successfully");
      },
      onError: (error) => {
        return toast.error(
          "Failed to save transcription, please try again in some time",
          {
            description: error.message,
          },
        );
      },
    },
  );

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleToggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) =>
        chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/mp3" });
        chunks.current = [];
        setAudioURL(URL.createObjectURL(blob));
        setAudioBlob(blob);
        setFile(new File([blob], "recording.mp3", { type: "audio/mp3" }));
        clearInterval(timerRef.current!);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!userId) {
    return <Loader2Icon className="w-8 h-8 animate-spin" />;
  }

  return (
    <div className="flex flex-col w-full max-w-3xl md:h-72">
      {isTranscribing || isUploading || isSavingTranscribe ? (
        <div className="absolute top-0 left-0 w-full h-full  flex items-center justify-center">
          <Loader2Icon className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <Card
          {...getRootProps()}
          className="bg-[#F9FFFD] flex flex-col justify-between w-full h-full"
        >
          <CardContent className="flex-grow pt-2">
            <div className="flex flex-col h-full w-full items-center justify-center p-4 rounded-md">
              <input
                ref={fileInputRef}
                {...getInputProps()}
                id="file-upload-handle"
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <audio
                    ref={audioRef}
                    src={audioURL}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <Button
                    size={"icon"}
                    className="p-1 rounded-full bg-[#668D7E] hover:bg-[#668D7E] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAudioPlayback();
                    }}
                  >
                    {isPlaying ? (
                      <PauseCircleIcon className="w-12 h-12" />
                    ) : (
                      <PlayCircleIcon className="w-12 h-12" />
                    )}
                  </Button>
                  <p className="mt-2">{file.name}</p>
                  {recordingTime > 0 && (
                    <p className="mt-2">
                      Recorded Time: {formatTime(recordingTime)}
                    </p>
                  )}
                </div>
              ) : (
                <Fragment>
                  {isRecording ? (
                    <Image
                      src="/recordingIcon.svg"
                      width={50}
                      height={50}
                      alt="Recording"
                    />
                  ) : (
                    <MicIcon className="p-1 rounded-full bg-[#668D7E] hover:bg-[#668D7E] text-white w-10 h-10" />
                  )}
                  {isRecording ? (
                    <div className="flex flex-col items-center">
                      <p>Recording in progress</p>
                      <p className="mt-2">{formatTime(recordingTime)}</p>
                    </div>
                  ) : (
                    <>
                      <p>
                        Enable mic access, record yourself, or upload an audio or video file
                      </p>
                      <p className="text-gray-400 text-sm">
                        Max file size: 5MB
                      </p>
                    </>
                  )}
                </Fragment>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col justify-center items-center w-full md:flex-row gap-4">
              {file ? (
                <Fragment>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setAudioURL("");
                      setAudioBlob(null);
                      setIsPlaying(false);
                      setUploadProgress(0);
                      setRecordingTime(0);
                    }}
                    className="flex gap-2 bg-white border-2 border-[#668D7E] hover:bg-white hover:border-2 hover:border-[#668D7E] text-[#668D7E]"
                  >
                    Restart
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      startUpload([file]);
                    }}
                    className="flex gap-2 bg-[#668D7E] hover:bg-[#668D7E] text-white"
                  >
                    <SendIcon className="w-4 h-4" />
                    Transcribe
                  </Button>
                </Fragment>
              ) : (
                <Fragment>
                  {!isRecording && (
                    <Button
                      onClick={handleUploadClick}
                      className="flex gap-2 bg-white border-2 border-[#668D7E] hover:bg-white hover:border-2 hover:border-[#668D7E] text-[#668D7E]"
                    >
                      <UploadIcon className="w-4 h-4" />
                      Upload File
                    </Button>
                  )}

                  {isRecording ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        stopRecording();
                      }}
                      className="flex gap-2 bg-white border-2 border-[#668D7E] hover:bg-white hover:border-2 hover:border-[#668D7E] text-[#668D7E]"
                    >
                      Stop Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRecording();
                      }}
                      className="flex gap-2 bg-[#668D7E] hover:bg-[#668D7E] text-white"
                    >
                      <MicIcon className="w-4 h-4" />
                      Start Recording
                    </Button>
                  )}
                </Fragment>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default RecorderCard;