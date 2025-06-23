// Background script for Resume Auto-Fill Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Resume Auto-Fill Extension installed');
});

// Handle extension icon click (optional)
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup, which is already configured in manifest.json
  console.log('Extension icon clicked');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'log') {
    console.log('Content script log:', request.message);
  }

  sendResponse({received: true});
});
