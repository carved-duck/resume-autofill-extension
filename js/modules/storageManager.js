// Storage Manager module for Chrome storage operations
export class StorageManager {
  constructor() {
    this.storageKey = 'resumeData';
    this.metadataKey = 'resumeMetadata';
  }

  async saveResumeData(data, source = 'unknown') {
    console.log('💾 Saving resume data:', data);

    const timestamp = new Date().toISOString();
    const metadata = {
      source: source, // 'linkedin', 'pdf', 'manual'
      timestamp: timestamp,
      version: '1.0',
      dataSize: JSON.stringify(data).length
    };

    return new Promise((resolve, reject) => {
      // Save both data and metadata
      chrome.storage.local.set({
        [this.storageKey]: data,
        [this.metadataKey]: metadata,
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
      chrome.storage.local.get([this.storageKey, this.metadataKey], function(result) {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to load resume data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const data = result[this.storageKey] || null;
          const metadata = result[this.metadataKey] || null;

          if (data && metadata) {
            console.log(`📋 Loaded resume data from ${metadata.source} (updated: ${metadata.timestamp})`);
          } else if (data) {
            console.log('📋 Loaded resume data (no metadata available)');
          } else {
            console.log('📋 No resume data found');
          }

          resolve(data);
        }
      });
    });
  }

  async getResumeMetadata() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.metadataKey, 'lastUpdated'], function(result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const metadata = result[this.metadataKey] || null;
          if (metadata) {
            metadata.lastUpdated = result.lastUpdated || metadata.timestamp;
          }
          resolve(metadata);
        }
      });
    });
  }

  async clearResumeData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([this.storageKey, this.metadataKey, 'lastUpdated'], function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('🗑️ Resume data and metadata cleared');
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
      chrome.storage.local.get([this.storageKey, this.metadataKey, 'lastUpdated'], function(result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const hasData = !!result[this.storageKey];
          const metadata = result[this.metadataKey] || {};

          resolve({
            hasData: hasData,
            source: metadata.source || 'Unknown',
            timestamp: metadata.timestamp || 'Unknown',
            lastUpdated: result.lastUpdated || metadata.timestamp || 'Never',
            dataSize: metadata.dataSize || 0,
            version: metadata.version || '1.0'
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
