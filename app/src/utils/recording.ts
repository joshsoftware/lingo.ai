export const getAudioDuration = async (audioUrl: string): Promise<string> => {
  try {
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

      audio.src = audioUrl;
    });
  } catch (error) {
    console.error("Error in getAudioDuration:", error);
 
    try {
      return await fetchAudioDurationFallback(audioUrl);
    } catch (fallbackError) {
      console.error("All fallback methods failed:", fallbackError);
      return "Unable to determine duration";
    }
  }
};

const fetchAudioDurationFallback = async (audioUrl: string): Promise<string> => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();

    let response: Response;
    try {
     
      response = await fetch(audioUrl, { 
        mode: 'cors',
        credentials: 'omit'
      });
    } catch (corsError) {
      console.warn("CORS mode failed, trying no-cors:", corsError);
      
      response = await fetch(audioUrl, { 
        mode: 'no-cors'
      });
    }
    
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



export const getFileSize = async (fileUrl: string): Promise<string> => {
  try {
    const response = await fetch(fileUrl);
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