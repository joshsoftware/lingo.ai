'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react'

export default function AudioRecorder2() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data)
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/ogg; codecs=opus' })
        chunks.current = []
        setAudioURL(URL.createObjectURL(blob))
        setAudioBlob(blob)
      }
      mediaRecorder.current.start()
      setIsRecording(true)
      startTimer()
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      stopTimer()
    }
  }

  const startTimer = () => {
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const deleteRecording = () => {
    setAudioURL('')
    setAudioBlob(null)
    setPlaybackTime(0)
    setProgress(0)
    setIsPlaying(false)
  }

  const uploadRecording = () => {
    if (audioBlob) {
      const link = document.createElement('a')
      link.href = audioURL
      link.download = 'recording.ogg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      console.log('No audio file to upload')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-4xl font-bold tabular-nums" aria-live="polite">
          {isRecording ? formatTime(recordingTime) : formatTime(playbackTime)}
        </div>
        {audioURL && (
          <Progress
            value={progress}
            className="w-full"
            aria-label="Audio playback progress"
          />
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {!isRecording && !audioURL && (
            <Button onClick={startRecording} aria-label="Start recording">
              <Mic className="w-6 h-6 mr-2" />
              Record
            </Button>
          )}
          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" aria-label="Stop recording">
              <Square className="w-6 h-6 mr-2" />
              Stop
            </Button>
          )}
          {audioURL && (
            <>
              <Button onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause className="w-6 h-6 mr-2" /> : <Play className="w-6 h-6 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button onClick={deleteRecording} variant="destructive" aria-label="Delete recording">
                <Trash2 className="w-6 h-6 mr-2" />
                Delete
              </Button>
              <Button onClick={uploadRecording} aria-label="Upload recording">
                <Upload className="w-6 h-6 mr-2" />
                Upload
              </Button>
            </>
          )}
        </div>
        {audioURL && (
          <audio
            ref={audioRef}
            src={audioURL}
            onTimeUpdate={() => {
              const currentTime = Math.floor(audioRef.current?.currentTime || 0)
              setPlaybackTime(currentTime)
              setProgress((currentTime / (audioRef.current?.duration || 1)) * 100)
            }}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </CardContent>
    </Card>
  )
}