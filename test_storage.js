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
