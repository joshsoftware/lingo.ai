// // Listen for installation
// chrome.runtime.onInstalled.addListener((details) => {
//   if (details.reason.search(/install/g) !== -1) {
//     // Open welcome page to request microphone permissions
//     chrome.tabs.create({
//       url: chrome.runtime.getURL("welcome.html"),
//       active: true,
//     });
//   }
// });

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'welcome.html' });
});

// This background script handles messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "recordingStarted") {
    console.log("Recording started");
  }

  if (message.action === "recordingStopped") {
    console.log("Recording stopped");
  }

  return true; // Indicates async response
});
