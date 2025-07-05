// Storage Manager module for Chrome storage operations
export class StorageManager {
  constructor() {
    this.storageKey = 'resumeData';
    this.metadataKey = 'resumeMetadata';
  }

  async saveResumeData(data, source = 'unknown') {
    console.log('💾 Saving resume data:', data);

    const timestamp = new Date().toISOString();
    const storageData = {
      data: data,
      source: source, // 'linkedin', 'pdf', 'manual'
      timestamp: timestamp,
      version: '1.0'
    };

    return new Promise((resolve, reject) => {
      // Save both data and metadata
      chrome.storage.local.set({
        [this.storageKey]: storageData,
        'lastUpdated': timestamp
      }, function() {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to save resume data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log(`✅ Resume data saved successfully (source: ${source})`);
          resolve();
        }
      });
    });
  }

  async getResumeData() {
    console.log('📖 Loading resume data...');
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey, 'lastUpdated'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to load resume data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const storageData = result[this.storageKey] || null;

          if (storageData && storageData.data) {
            console.log(`📋 Loaded resume data from ${storageData.source} (updated: ${storageData.timestamp})`);
            resolve(storageData.data); // Return just the data part
          } else if (storageData) {
            console.log('📋 Loaded resume data (no metadata available)');
            resolve(storageData); // Legacy support
          } else {
            console.log('📋 No resume data found');
            resolve(null);
          }
        }
      });
    });
  }

  async getResumeMetadata() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey, 'lastUpdated'], function(result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const storageData = result[this.storageKey] || null;
          if (storageData) {
            storageData.lastUpdated = result.lastUpdated || storageData.timestamp;
          }
          resolve(storageData);
        }
      });
    });
  }

  async clearResumeData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([this.storageKey, 'lastUpdated'], function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('🗑️ Resume data cleared');
          resolve();
        }
      });
    });
  }

  async hasResumeData() {
    const data = await this.getResumeData();
    return data !== null;
  }

  async getStorageInfo() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey, 'lastUpdated'], function(result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const storageData = result[this.storageKey] || null;
          const hasData = !!storageData && !!storageData.data;

          resolve({
            hasData: hasData,
            source: storageData?.source || 'Unknown',
            timestamp: storageData?.timestamp || 'Unknown',
            lastUpdated: result.lastUpdated || storageData?.timestamp || 'Never',
            dataSize: storageData?.data ? JSON.stringify(storageData.data).length : 0,
            version: storageData?.version || '1.0'
          });
        }
      });
    });
  }

  // Backup methods for additional storage options
  async exportResumeData() {
    const data = await this.getResumeData();
    const metadata = await this.getResumeMetadata();

    return {
      data: data,
      metadata: metadata,
      exportedAt: new Date().toISOString()
    };
  }

  async importResumeData(exportedData, source = 'import') {
    if (exportedData && exportedData.data) {
      await this.saveResumeData(exportedData.data, source);
      return true;
    }
    return false;
  }
}
