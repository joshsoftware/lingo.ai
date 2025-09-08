import { getProxyUrl } from './urlUtils';

/**
 * Utility functions for audio recording, metadata handling, and display formatting
 */

/**
 * Formats duration in seconds to MM:SS format
 * @param seconds - Duration in seconds (can be a decimal)
 * @returns Formatted duration string in MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

/**
 * Fetches audio duration using HTML Audio API with fallback to AudioContext
 * @param audioUrl - The URL of the audio file
 * @returns Promise that resolves to formatted duration string
 */
export const getAudioDuration = async (audioUrl: string): Promise<string> => {
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
        resolve(formatDuration(duration));
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

/**
 * Fallback method to get audio duration using AudioContext
 * @param audioUrl - The URL of the audio file
 * @returns Promise that resolves to formatted duration string
 */
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
    
    return formatDuration(duration);
  } catch (error) {
    console.error("Fetch fallback method failed:", error);
    throw error;
  }
};

/**
 * Fetches file size from a URL
 * @param fileUrl - The URL of the file
 * @returns Promise that resolves to formatted file size string
 */
export const getFileSize = async (fileUrl: string): Promise<string> => {
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
