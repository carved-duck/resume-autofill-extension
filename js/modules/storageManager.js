// Storage Manager module for Chrome storage operations
export class StorageManager {
  constructor() {
    this.storageKey = 'resumeData';
  }

  async saveResumeData(data) {
    console.log('💾 Saving resume data:', data);
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: data }, function() {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to save resume data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('✅ Resume data saved successfully');
          resolve();
        }
      });
    });
  }

  async getResumeData() {
    console.log('📖 Loading resume data...');
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], function(result) {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to load resume data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const data = result[this.storageKey] || null;
          console.log('📋 Loaded resume data:', data ? 'Data found' : 'No data found');
          resolve(data);
        }
      });
    });
  }

  async clearResumeData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([this.storageKey], function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  async hasResumeData() {
    const data = await this.getResumeData();
    return data !== null;
  }
}
