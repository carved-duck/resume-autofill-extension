// Simple storage test
console.log('🧪 Testing storage functionality...');

// Test Chrome storage directly
chrome.storage.local.set({test: 'data'}, () => {
  console.log('✅ Chrome storage write test successful');

  chrome.storage.local.get(['test'], (result) => {
    console.log('✅ Chrome storage read test successful:', result);
  });
});

// Test if our classes are available
console.log('🔍 Available classes:');
console.log('- ResumeStorageManager:', typeof window.ResumeStorageManager);
console.log('- NotificationManager:', typeof window.NotificationManager);
console.log('- DataValidator:', typeof window.DataValidator);

// Test LinkedIn extraction
console.log('🔍 Testing LinkedIn extraction...');
const nameElement = document.querySelector('h1.text-heading-xlarge');
const headlineElement = document.querySelector('.text-body-medium.break-words');
console.log('Name element:', nameElement?.textContent?.trim());
console.log('Headline element:', headlineElement?.textContent?.trim());

// Test storage data
chrome.storage.local.get(['resumeData', 'lastUpdated'], (result) => {
  console.log('📦 Current storage data:', result);
  if (result.resumeData) {
    console.log('✅ Resume data found in storage');
    console.log('Source:', result.resumeData.source);
    console.log('Timestamp:', result.resumeData.timestamp);
    console.log('Data preview:', JSON.stringify(result.resumeData.data).substring(0, 200) + '...');
  } else {
    console.log('❌ No resume data in storage');
  }
});
