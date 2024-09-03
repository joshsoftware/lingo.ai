'use client'

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/utils/uploadthing";
import { buttonVariants } from "./ui/button";
import { MicIcon, PauseIcon, PlayIcon, SquareIcon, UploadIcon } from "lucide-react";
import useTranscriptions from "@/hooks/useTranscriptions";

const mainVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const buttonVariant = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

export const AudioRecorder = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState('')


  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const { uploadUserFiles } = useTranscriptions();

  const { startUpload, isUploading } = useUploadThing(
    "audioUploader",
    {
      onBeforeUploadBegin: (files: File[]) => files,
      onUploadProgress: (progress: number) => setUploadProgress(progress),
      onClientUploadComplete: (res) => {
        uploadUserFiles(res);
        setFile(null);
        setAudioURL('')
        setAudioBlob(null)
        setIsPlaying(false)
        setUploadProgress(0);
      },
      onUploadError: () => {
        console.log("upload error");
        setFile(null);
        setAudioURL('')
        setAudioBlob(null)
        setIsPlaying(false)
        setUploadProgress(0);
      },
    },
  );

  const handleFileChange = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setAudioURL(URL.createObjectURL(newFiles[0]))
      onChange && onChange(newFiles);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/ogg; codecs=opus' });
        chunks.current = [];
        setAudioURL(URL.createObjectURL(blob))
        setAudioBlob(blob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setIsPlaying(true)
      } else {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: handleFileChange,
    accept: {
      'audio/*': ['.mp3', '.wav'],
    },
    onDropRejected: (error) => console.log(error),
    noDrag: true,
  });

  return (
    <div className="">
      <motion.div layout>
        <motion.div layout>
          {file && (
            <motion.div
              key={"file"}
              variants={mainVariant}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                "shadow-sm"
              )}
            >
              <div className="flex justify-between w-full items-center gap-4">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                  className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                >
                  {file.name}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                  className="rounded-lg px-2 py-1 w-fit flex-shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                >
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </motion.p>
              </div>

              <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                  className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800"
                >
                  {file.type}
                </motion.p>

                <div className="flex gap-2">

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layout
                    className={buttonVariants({ size: "xs" })}
                  >
                    {audioURL && (
                      <audio
                        ref={audioRef}
                        src={audioURL}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                    )}
                    <motion.div onClick={(e) => {
                      e.stopPropagation()
                      togglePlayback()
                    }
                    } aria-label={isPlaying ? "Pause" : "Play"}>
                      <div className="flex justify-center items-center">
                        {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                        {isPlaying ? "Pause" : "Play"}
                      </div>
                    </motion.div>
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layout
                    className={buttonVariants({ size: "xs" })}
                    onClick={(e) => {
                      e.stopPropagation();
                      startUpload([file]);
                      setFile(null);
                      setAudioURL('')
                      setAudioBlob(null)
                      setIsPlaying(false)
                      setUploadProgress(0);
                    }}
                  >
                    upload
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layout
                    className={buttonVariants({ variant: "destructive", size: "xs" })}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setAudioURL('')
                      setAudioBlob(null)
                      setIsPlaying(false)
                      setUploadProgress(0);
                    }}
                  >
                    cancel
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        <div className="flex flex-row gap-2">
          <div {...getRootProps()}>
            <motion.div>
              <input
                ref={fileInputRef}
                {...getInputProps()}
                id="file-upload-handle"
                className="hidden"
              />
              {(!file && !isUploading && !isRecording) && (
                <motion.div
                  variants={buttonVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={cn("flex items-center gap-2 justify-center", buttonVariants({ variant: 'secondary', size: "xs" }))}
                >
                  <UploadIcon className="h-4 w-4" />
                  Upload
                </motion.div>
              )}
              {isUploading && (
                <motion.div
                  variants={buttonVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onClick={(e) => e.stopPropagation()}
                  className={buttonVariants({ size: "xs", variant: "secondary" })}
                >
                  Uploading {uploadProgress}%
                </motion.div>
              )}
            </motion.div>
          </div>
          <motion.div>
            {(!file && !isRecording && !isUploading) && (
              <motion.button
                variants={buttonVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                className={buttonVariants({ size: "xs" })}
                onClick={(e) => {
                  e.stopPropagation();
                  startRecording();
                }}
                aria-label="Start recording"
              >
                <MicIcon className="w-4 h-4" />
                Record
              </motion.button>
            )}
            {isRecording && (
              <motion.button
                variants={buttonVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(new File([audioBlob as Blob], 'audio-recording.ogg', { type: 'audio/ogg; codecs=opus' }));
                  stopRecording();
                }}
                className={buttonVariants({ variant: "destructive", size: "xs" })}
                aria-label="Stop recording"
              >
                <SquareIcon className="w-4 h-4" />
                Stop
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};