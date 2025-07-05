// Background script for storage debugging and cross-tab communication
console.log('🔄 Background script loaded');

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('📦 Storage changed:', changes, 'in namespace:', namespace);

  // Notify all tabs about storage changes
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'storageChanged',
          changes: changes
        }).catch(() => {
          // Ignore errors for tabs that don't have content scripts
        });
      }
    });
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message);

  if (message.action === 'saveResumeData') {
    chrome.storage.local.set({
      'resumeData': message.data,
      'lastUpdated': new Date().toISOString()
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Background storage save failed:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ Background storage save successful');
        sendResponse({ success: true });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'loadResumeData') {
    chrome.storage.local.get(['resumeData', 'lastUpdated'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Background storage load failed:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('📂 Background storage load result:', result);
        sendResponse({ success: true, data: result });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'getStorageInfo') {
    chrome.storage.local.get(['resumeData', 'lastUpdated'], (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({
          success: true,
          info: {
            hasData: !!result.resumeData,
            source: result.resumeData?.source || 'Unknown',
            lastUpdated: result.lastUpdated || 'Never',
            dataSize: JSON.stringify(result.resumeData || {}).length
          }
        });
      }
    });
    return true; // Keep message channel open for async response
  }
});

// Debug storage on startup
chrome.storage.local.get(['resumeData', 'lastUpdated'], (result) => {
  console.log('🔍 Background storage check on startup:', result);
});
