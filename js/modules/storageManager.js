// Storage Manager module for Chrome storage operations
export class StorageManager {
  constructor() {
    this.storageKey = 'resumeData';
  }

  async saveResumeData(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: data }, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  async getResumeData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], function(result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[this.storageKey] || null);
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
