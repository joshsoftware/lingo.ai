/**
 * Utility functions for consistent audio metadata display across components
 */

export interface AudioDisplayState {
  duration: string | null;
  fileSize: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Formats duration display with consistent fallback logic
 * @param duration - The raw duration string from useAudioMetadata
 * @param isLoading - Loading state from useAudioMetadata
 * @param error - Error state from useAudioMetadata
 * @param prefix - Optional prefix for the duration (e.g., "Duration: ")
 * @returns Formatted duration string with appropriate fallback
 */
export const formatDurationDisplay = (
  duration: string | null,
  isLoading: boolean,
  error: string | null,
  prefix: string = ""
): string => {
  if (duration) {
    return `${prefix}${duration}`;
  }
  
  if (isLoading) {
    return `${prefix}Loading...`;
  }
  
  if (error) {
    return `${prefix}--:--`;
  }
  
  return `${prefix}--:--`;
};

/**
 * Formats file size display with consistent fallback logic
 * @param fileSize - The raw file size string from useAudioMetadata
 * @param isLoading - Loading state from useAudioMetadata
 * @param error - Error state from useAudioMetadata
 * @returns Formatted file size string with appropriate fallback
 */
export const formatFileSizeDisplay = (
  fileSize: string | null,
  isLoading: boolean,
  error: string | null
): string => {
  if (fileSize) {
    return fileSize;
  }
  
  if (isLoading) {
    return "Loading...";
  }
  
  if (error) {
    return "Unknown size";
  }
  
  return "Unknown size";
};

/**
 * Formats audio metadata display using the new display properties from useAudioMetadata
 * This is the preferred method when using the updated hook
 * @param displayDuration - The display duration from useAudioMetadata
 * @param displayFileSize - The display file size from useAudioMetadata
 * @param prefix - Optional prefix for the duration
 * @returns Object with formatted duration and file size
 */
export const formatAudioDisplay = (
  displayDuration: string,
  displayFileSize: string,
  prefix: string = ""
) => ({
  duration: `${prefix}${displayDuration}`,
  fileSize: displayFileSize
});
