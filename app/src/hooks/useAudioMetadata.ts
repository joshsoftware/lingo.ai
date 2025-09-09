import { useState, useEffect, useCallback, useRef } from 'react';
import { getAudioDuration, getFileSize } from '@/utils/recording';

const audioMetadataCache = new Map<string, {
  duration: string;
  fileSize: string;
  displayDuration: string;
  displayFileSize: string;
  timestamp: number;
}>();

const CACHE_DURATION = 24 * 60 * 60 * 1000; 

interface AudioMetadata {
  duration: string | null;
  fileSize: string | null;
  isLoading: boolean;
  error: string | null;
  displayDuration: string;
  displayFileSize: string;
}

const getCachedMetadata = (url: string) => {
  const cached = audioMetadataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  // Remove expired cache
  if (cached) {
    audioMetadataCache.delete(url);
  }
  return null;
};

const setCachedMetadata = (url: string, duration: string, fileSize: string) => {
  const displayDuration = duration || "--:--";
  const displayFileSize = fileSize || "Unknown size";
  
  audioMetadataCache.set(url, {
    duration,
    fileSize,
    displayDuration,
    displayFileSize,
    timestamp: Date.now()
  });
};


export const useAudioMetadata = (audioUrl: string | null): AudioMetadata => {
  const [metadata, setMetadata] = useState<AudioMetadata>({
    duration: null,
    fileSize: null,
    displayDuration: "Loading...",
    displayFileSize: "Loading...",
    isLoading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMetadata = useCallback(async (url: string) => {
    // Check cache first
    const cached = getCachedMetadata(url);
    if (cached) {
      console.log('🎯 Using cached metadata for:', url);
      setMetadata({
        duration: cached.duration,
        fileSize: cached.fileSize,
        displayDuration: cached.displayDuration,
        displayFileSize: cached.displayFileSize,
        isLoading: false,
        error: null
      });
      return;
    }

    console.log('🔄 Fetching metadata for:', url);
    setMetadata(prev => ({ ...prev, isLoading: true, error: null }));


    abortControllerRef.current = new AbortController();

    try {
    
      const [duration, fileSize] = await Promise.all([
        getAudioDuration(url),
        getFileSize(url)
      ]);

   
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

    
      setCachedMetadata(url, duration, fileSize);

      const displayDuration = duration || "--:--";
      const displayFileSize = fileSize || "Unknown size";
      
      setMetadata({
        duration,
        fileSize,
        displayDuration,
        displayFileSize,
        isLoading: false,
        error: null
      });
    } catch (error) {
    
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching audio metadata:', error);
      setMetadata(prev => ({
        ...prev,
        displayDuration: "--:--",
        displayFileSize: "Unknown size",
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metadata'
      }));
    }
  }, []);

  useEffect(() => {
    if (!audioUrl) {
      setMetadata({
        duration: null,
        fileSize: null,
        displayDuration: "--:--",
        displayFileSize: "Unknown size",
        isLoading: false,
        error: null
      });
      return;
    }

    fetchMetadata(audioUrl);

   
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [audioUrl, fetchMetadata]);

  return metadata;
};


export const clearAudioMetadataCache = () => {
  audioMetadataCache.clear();
};


export const getAudioMetadataCacheSize = () => {
  return audioMetadataCache.size;
};

