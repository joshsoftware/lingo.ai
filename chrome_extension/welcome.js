document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const statusDiv = document.getElementById("status");
  const resumeBtn = document.getElementById("resumeBtn");
  const transcribeBtn = document.getElementById("transcribeBtn");

  let mediaRecorder;
  let audioChunks = [];
  let stream;
  let activeTabName;
  let recordingFileName;

  // Server URL to which the audio will be streamed
  const SERVER_URL = "https://lingo.ai.joshsoftware.com";

  // Function to format the current date and time as a string
  function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-indexed
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  // Function to generate a filename based on tab title and current date-time
  function generateRecordingFilename(tabTitle) {
    const now = new Date();
    const formattedDateTime = formatDateTime(now);

    // Ensure the tab title is safe for use in a filename (remove any invalid characters)
    const safeTabTitle = tabTitle.replace(/[<>:"/\\|?*]/g, "_"); // Replace invalid filename characters

    return `${safeTabTitle}_${formattedDateTime}.webm`; // Example format: TabName_2025-03-06_14-30-45_123.webm
  }

  startBtn.addEventListener("click", async function () {
    try {
      // Request microphone (this should work if permission was granted in welcome page)
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Merge incoming and outgoing audio streams
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Create a MediaStreamAudioSourceNode for the microphone stream
      const microphoneSource = audioContext.createMediaStreamSource(stream);
      microphoneSource.connect(destination);

      // Capture system audio (requires additional permissions and setup)
      const systemAudioStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
      });

      const systemAudioSource =
        audioContext.createMediaStreamSource(systemAudioStream);
      systemAudioSource.connect(destination);

      // Use the combined stream for recording
      stream = destination.stream;
      // Create MediaRecorder instance
      mediaRecorder = new MediaRecorder(stream);

      // get active tab name
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0]; // Get the active tab
        activeTabName = currentTab.title;
      });

      // Event handler for when data is available
      mediaRecorder.ondataavailable = function (event) {
        audioChunks.push(event.data);

        // Stream the audio chunk to the server
        if (event.data.size > 0) {
          streamToServer(event.data);
        }
      };

      // Event handler for when recording is stopped
      mediaRecorder.onstop = function () {
        if (audioChunks.length > 0) {
          streamToServer(audioChunks);
        }
        // Clear the audioChunks array
        audioChunks = [];

        // Update UI
        statusDiv.textContent = "Recording stopped";
        stopBtn.style.display = "none";

        // Notify background script
        chrome.runtime.sendMessage({ action: "recordingStopped" });
      };

      // Start recording
      mediaRecorder.start(); // Capture in 1-second intervals

      // Update UI
      statusDiv.textContent = "Recording...";
      startBtn.style.display = "none";
      stopBtn.style.display = "block";

      // Notify background script
      chrome.runtime.sendMessage({ action: "recordingStarted" });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      statusDiv.textContent = "Error: " + err.message;
    }
  });

  // handle pause recording
  stopBtn.addEventListener("click", function () {
    mediaRecorder.pause();
    resumeBtn.style.display = "block";
    transcribeBtn.style.display = "block";
    stopBtn.style.display = "none";
    statusDiv.textContent = "Recording Paused";
    // }
  });

  //handle resume
  resumeBtn.addEventListener("click", function () {
    mediaRecorder.resume();
    resumeBtn.style.display = "none";
    transcribeBtn.style.display = "none";
    stopBtn.style.display = "block";
    statusDiv.textContent = "Recording...";
  });

  transcribeBtn.addEventListener("click", function () {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      resumeBtn.style.display = "none";
      transcribeBtn.style.display = "none";
      stopBtn.style.display = "none";
      startBtn.style.display = "none";
      // Stop all tracks of the stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  });

  // Function to stream audio chunks to the server
  async function streamToServer(audioBlob) {
    try {
      console.log("start", audioBlob);

      // Create a base64 string from the audioBlob
      const base64String = await blobToBase64(audioBlob);
      console.log("Base64 Data:", base64String);

      recordingFileName = generateRecordingFilename(activeTabName);
      // Prepare the payload to send to the server, including the audio duration
      const payload = {
        file: {
          name: recordingFileName,
          type: audioBlob.type,
          size: audioBlob.size,
          lastModified: Date.now(),
          base64Data: base64String,
        },
      };
      console.log("payload", payload);
      statusDiv.textContent = "Uploading to server...";
      // Request to sign the file with AWS S3
      const signedData = await postToServer(
        SERVER_URL + "/api/aws/s3/sign",
        payload
      );
      console.log("AWS S3 Signed Data:", signedData);

      // Transcribe the file after it is successfully signed
      const transcriptionData = await transcribeFile(
        signedData.url,
        signedData.key
      );
      console.log("Transcription Data:", transcriptionData);

      // Save the transcription results
      const saveData = await saveTranscription(signedData, transcriptionData);
      console.log("Save Response:", saveData);

      // Open the transcription in a new tab
      statusDiv.textContent = "Opening in new window...";
      window.open(SERVER_URL + "/transcriptions/" + saveData[0].id, "_blank");
      startBtn.style.display = "block";
      statusDiv.textContent = "Ready to record?";
    } catch (error) {
      console.error("Error streaming to server:", error);
    }
  }

  // Function to convert Blob to Base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Helper function to send data to the server
  async function postToServer(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error posting data to ${url}`);
    }
    return response.json();
  }

  // Function to initiate transcription
  async function transcribeFile(url, key) {
    statusDiv.textContent = "Transcribing...";
    const payload = { documentUrl: url, documentName: recordingFileName };
    return postToServer(SERVER_URL + "/api/transcribe", payload);
  }

  // Function to save transcription results
  async function saveTranscription(signedData, transcriptionData) {
    statusDiv.textContent = "Saving to database...";
    const payload = {
      documentUrl: signedData.url,
      userID: "huvcypmasa5xwgyf",
      documentName: recordingFileName,
      summary: transcriptionData.summary,
      translation: transcriptionData.translation,
      // audioDuration: 1, // Include the calculated audio duration
      segments: transcriptionData.segments,
    };
    console.log("in payload", payload);
    return postToServer(SERVER_URL + "/api/transcribe/save", payload);
  }
});
