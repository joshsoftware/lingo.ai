import { useState, useEffect, useCallback, useRef } from 'react';
import { getProxyUrl } from '@/utils/urlUtils';

const audioMetadataCache = new Map<string, {
  duration: string;
  fileSize: string;
  timestamp: number;
}>();

const CACHE_DURATION = 24 * 60 * 60 * 1000; 

interface AudioMetadata {
  duration: string | null;
  fileSize: string | null;
  isLoading: boolean;
  error: string | null;
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
  audioMetadataCache.set(url, {
    duration,
    fileSize,
    timestamp: Date.now()
  });
};

const getAudioDuration = async (audioUrl: string): Promise<string> => {
  try {
    const proxyUrl = getProxyUrl(audioUrl);
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Audio loading timeout"));
      }, 10000); 

      audio.addEventListener("loadedmetadata", () => {
        clearTimeout(timeout);
        const duration = audio.duration;
        if (isNaN(duration) || !isFinite(duration)) {
          console.warn("HTML Audio gave invalid duration, trying fallback method");
          fetchAudioDurationFallback(audioUrl)
            .then(resolve)
            .catch(() => reject(new Error("Invalid audio duration")));
          return;
        }
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        resolve(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
      });

      audio.addEventListener("error", (e) => {
        clearTimeout(timeout);
        console.warn("HTML Audio method failed, trying fetch method:", e);
        fetchAudioDurationFallback(audioUrl)
          .then(resolve)
          .catch(reject);
      });

      audio.src = proxyUrl;
    });
  } catch (error) {
    console.error("Error in getAudioDuration:", error);
    try {
      return await fetchAudioDurationFallback(audioUrl);
    } catch (fallbackError) {
      console.error("All fallback methods failed:", fallbackError);
      return "--:--";
    }
  }
};

const fetchAudioDurationFallback = async (audioUrl: string): Promise<string> => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    const proxyUrl = getProxyUrl(audioUrl);
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;
    
    if (isNaN(duration) || !isFinite(duration)) {
      throw new Error("Invalid duration from audio buffer");
    }
    
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  } catch (error) {
    console.error("Fetch fallback method failed:", error);
    throw error;
  }
};

const getFileSize = async (fileUrl: string): Promise<string> => {
  try {
    const proxyUrl = getProxyUrl(fileUrl);
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      console.error(`Error fetching file: ${response.status} ${response.statusText}`);
      return "Invalid size";
    }
    const blob = await response.blob();
    const sizeInBytes = blob.size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  } catch (error) {
    console.error("Error fetching file size:", error);
    return "Invalid size";
  }
};

export const useAudioMetadata = (audioUrl: string | null): AudioMetadata => {
  const [metadata, setMetadata] = useState<AudioMetadata>({
    duration: null,
    fileSize: null,
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

      setMetadata({
        duration,
        fileSize,
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

