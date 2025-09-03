
const getProxyUrl = (audioUrl: string): string => {
  if (audioUrl.includes('.s3.') || audioUrl.includes('s3.amazonaws.com')) {
    const url = new URL(audioUrl);
    const key = url.pathname.substring(1);
    return `/api/proxy?url=${encodeURIComponent(audioUrl)}`;
  }
  return audioUrl;
};

export const getAudioDuration = async (audioUrl: string): Promise<string> => {
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    const proxyUrl = getProxyUrl(audioUrl);
    const response = await fetch(proxyUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  } catch (error) {
    console.error("Error decoding audio data:", error);
    return "Invalid duration";
  }
};

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