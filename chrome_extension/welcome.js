document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const statusDiv = document.getElementById("status");
  let mediaRecorder;
  let audioChunks = [];
  let stream;

  // Server URL to which the audio will be streamed
  const SERVER_URL = "https://your-streaming-server.com/upload";

  // Check if microphone permission was granted
  // chrome.storage.local.get(["microphonePermissionGranted"], function (result) {
  //   if (result.microphonePermissionGranted) {
  //     statusDiv.textContent = "Ready to record";
  //   } else {
  //     statusDiv.textContent =
  //       "Please complete setup by opening the welcome page";

  //     // Add button to open welcome page
  //     const setupBtn = document.createElement("button");
  //     setupBtn.textContent = "Open Setup Page";
  //     setupBtn.className = "btn";
  //     setupBtn.style.backgroundColor = "#4285f4";
  //     setupBtn.onclick = function () {
  //       chrome.tabs.create({
  //         url: chrome.runtime.getURL("welcome.html"),
  //       });
  //     };
  //     document.body.insertBefore(setupBtn, startBtn);
  //   }
  // });

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

      // Event handler for when data is available
      mediaRecorder.ondataavailable = function (event) {
        audioChunks.push(event.data);

        // Stream the audio chunk to the server
        if (event.data.size > 0) {
          downloadAudio(event.data);
          // streamToServer(event.data);
        }
      };

      // Event handler for when recording is stopped
      mediaRecorder.onstop = function () {
        if (audioChunks > 0) {
          downloadAudio(audioChunks);
          // streamToServer(audioChunks);
        }
        // Clear the audioChunks array
        audioChunks = [];

        // Update UI
        statusDiv.textContent = "Recording stopped";
        startBtn.style.display = "block";
        stopBtn.style.display = "none";

        // Notify background script
        chrome.runtime.sendMessage({ action: "recordingStopped" });
      };

      // Start recording
      mediaRecorder.start(50000); // Capture in 1-second intervals

      // Update UI
      statusDiv.textContent = "Recording...";
      startBtn.style.display = "none";
      stopBtn.style.display = "block";

      // Notify background script
      chrome.runtime.sendMessage({ action: "recordingStarted" });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      statusDiv.textContent = "Error: " + err.message;

      // if (err.name === "NotAllowedError") {
      //   statusDiv.textContent = "Microphone permission denied.";

      //   // Create button to open welcome page
      //   const reopenSetupBtn = document.createElement("button");
      //   reopenSetupBtn.textContent = "Grant Microphone Access";
      //   reopenSetupBtn.className = "btn";
      //   reopenSetupBtn.style.backgroundColor = "#4285f4";
      //   reopenSetupBtn.onclick = function () {
      //     chrome.tabs.create({
      //       url: chrome.runtime.getURL("welcome.html"),
      //     });
      //   };
      //   document.body.appendChild(reopenSetupBtn);
      // } else {
      //   statusDiv.textContent = "Error: " + err.message;
      // }
    }
  });

  stopBtn.addEventListener("click", function () {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();

      // Stop all tracks of the stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  });

  function downloadAudio(audioBlob) {
    const audioURL = URL.createObjectURL(audioBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = audioURL;
    downloadLink.download = "recording.webm";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Optional: Show status to the user
    if (typeof statusDiv !== "undefined") {
      statusDiv.textContent = "Audio downloaded successfully";
    }

    // Release the blob URL
    URL.revokeObjectURL(audioURL);
  }

  // Replace the streamToServer function call with downloadAudio

  // Function to stream audio chunks to the server
  function streamToServer(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    debugger;
    fetch(SERVER_URL, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error streaming to server:", error);
        statusDiv.textContent = "Error streaming: " + error.message;
      });
  }
});
