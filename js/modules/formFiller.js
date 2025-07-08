// Enhanced Form Filler module for intelligent form filling and dynamic page interaction
import { isSupportedSite } from './config.js';

export class FormFiller {
  constructor() {
    this.isAnalyzing = false;
    this.currentAnalysis = null;
  }

  async fillForm(resumeData) {
    if (!resumeData) {
      throw new Error('No resume data found. Please upload a resume first.');
    }

    const currentTab = await this.getCurrentTab();

    // Check if we're on a supported site
    const supportedSites = [
      'linkedin.com',
      'indeed.com',
      'glassdoor.com',
      'monster.com',
      'ziprecruiter.com',
      'workday.com',
      'greenhouse.io',
      'lever.co',
      'wantedly.com',
      'gaijinpot.com'
    ];

    const isSupportedSite = supportedSites.some(site => currentTab.url.includes(site));

    if (!isSupportedSite) {
      throw new Error('This site is not yet supported for auto-fill. Please navigate to a supported job site.');
    }

    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Form filling communication timeout'));
      }, 10000);

      chrome.tabs.sendMessage(currentTab.id, {
        action: 'fillForm',
        data: resumeData
      }, (response) => {
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          console.error('❌ Content script communication failed:', chrome.runtime.lastError.message);
          reject(new Error('Could not communicate with page. Please refresh the page and try again.'));
          return;
        }

        if (!response) {
          reject(new Error('Could not communicate with page. Please refresh the page and try again.'));
          return;
        }

        if (response.success) {
          resolve({
            success: true,
            fieldsCount: response.result?.fieldsCount || 0,
            message: response.result?.message || 'Form filled successfully'
          });
        } else {
          reject(new Error(response.error || 'Unknown error'));
        }
      });
    });
  }

  // Fill form using data stored in Chrome storage (cross-tab persistence)
  async fillFormFromStorage() {
    const currentTab = await this.getCurrentTab();

    // Check if we're on a supported site
    const supportedSites = [
      'linkedin.com',
      'indeed.com',
      'glassdoor.com',
      'monster.com',
      'ziprecruiter.com',
      'workday.com',
      'greenhouse.io',
      'lever.co',
      'wantedly.com',
      'gaijinpot.com'
    ];

    const isSupportedSite = supportedSites.some(site => currentTab.url.includes(site));

    if (!isSupportedSite) {
      throw new Error('This site is not yet supported for auto-fill. Please navigate to a supported job site.');
    }

    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Form filling communication timeout'));
      }, 10000);

      chrome.tabs.sendMessage(currentTab.id, {
        action: 'fillForm'
        // No data - content script will load from storage
      }, (response) => {
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          console.error('❌ Content script communication failed:', chrome.runtime.lastError.message);
          reject(new Error('Could not communicate with page. Please refresh the page and try again.'));
          return;
        }

        if (!response) {
          reject(new Error('Could not communicate with page. Please refresh the page and try again.'));
          return;
        }

        if (response.success) {
          resolve({
            success: true,
            fieldsCount: response.result?.fieldsCount || 0,
            message: response.result?.message || 'Form filled successfully'
          });
        } else {
          reject(new Error(response.error || 'No stored resume data found. Please upload a resume or extract from LinkedIn first.'));
        }
      });
    });
  }

  // Enhanced page analysis with dynamic intelligence
  async analyzePageStructure() {
    const currentTab = await this.getCurrentTab();

    if (this.isAnalyzing) {
      throw new Error('Page analysis already in progress...');
    }

    this.isAnalyzing = true;

    try {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'analyzePageStructure'
        }, (response) => {
          this.isAnalyzing = false;

          if (chrome.runtime.lastError) {
            reject(new Error('Content script not available: ' + chrome.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error('Could not analyze page. Make sure content script is loaded.'));
            return;
          }

          if (response.success) {
            this.currentAnalysis = response.analysis;
            resolve({
              analysis: response.analysis,
              recommendations: response.recommendations,
              monitoring: response.monitoring
            });
          } else {
            reject(new Error(response.error || 'Page analysis failed'));
          }
        });
      });
    } catch (error) {
      this.isAnalyzing = false;
      throw error;
    }
  }

  // Try intelligent buttons with enhanced feedback
  async tryIntelligentButtons() {
    const currentTab = await this.getCurrentTab();

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'tryIntelligentButtons'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Content script not available: ' + chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error('Could not communicate with page'));
          return;
        }

        if (response.success) {
          resolve({
            success: true,
            results: response.results,
            message: response.message
          });
        } else {
          reject(new Error(response.error || 'Intelligent button interaction failed'));
        }
      });
    });
  }

  // Start dynamic monitoring
  async startMonitoring() {
    const currentTab = await this.getCurrentTab();

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'startMonitoring'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Content script not available: ' + chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error('Could not start monitoring'));
          return;
        }

        if (response.success) {
          resolve({
            success: true,
            message: response.message
          });
        } else {
          reject(new Error(response.error || 'Failed to start monitoring'));
        }
      });
    });
  }

  // Stop dynamic monitoring
  async stopMonitoring() {
    const currentTab = await this.getCurrentTab();

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'stopMonitoring'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Content script not available: ' + chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error('Could not stop monitoring'));
          return;
        }

        if (response.success) {
          resolve({
            success: true,
            message: response.message
          });
        } else {
          reject(new Error(response.error || 'Failed to stop monitoring'));
        }
      });
    });
  }

  // Legacy method for backward compatibility
  async tryClickEditButtons() {
    return this.tryIntelligentButtons();
  }

  async getCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs && tabs.length > 0) {
          resolve(tabs[0]);
        } else {
          reject(new Error('No active tab found'));
        }
      });
    });
  }

  async isContentScriptReady() {
    try {
      const currentTab = await this.getCurrentTab();

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'ping'
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(false);
            return;
          }
          resolve(!!response?.success);
        });
      });
    } catch (error) {
      return false;
    }
  }

  // Get enhanced content script info
  async getContentScriptInfo() {
    try {
      const currentTab = await this.getCurrentTab();

      // Check if we're on a supported site first
      const supportedSites = [
        'linkedin.com',
        'indeed.com',
        'glassdoor.com',
        'monster.com',
        'ziprecruiter.com',
        'workday.com',
        'greenhouse.io',
        'lever.co',
        'wantedly.com',
        'gaijinpot.com'
      ];

      const isSupportedSite = supportedSites.some(site => currentTab.url.includes(site));

      if (!isSupportedSite) {
        throw new Error('Not on a supported job site');
      }

      return new Promise((resolve, reject) => {
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('Content script communication timeout'));
        }, 3000);

        chrome.tabs.sendMessage(currentTab.id, {
          action: 'ping'
        }, (response) => {
          clearTimeout(timeout);

          if (chrome.runtime.lastError) {
            // Content script not available - this is expected on many pages
            console.log('ℹ️ Content script not available:', chrome.runtime.lastError.message);
            reject(new Error('Content script not available'));
            return;
          }

          if (response && response.success) {
            resolve({
              ready: true,
              features: response.features || [],
              message: response.message || 'Content script is active'
            });
          } else {
            console.log('ℹ️ Content script not responding as expected');
            reject(new Error('Content script not responding'));
          }
        });
      });
    } catch (error) {
      console.error('❌ Failed to get content script info:', error);
      throw error;
    }
  }

  // Get current analysis data
  getCurrentAnalysis() {
    return this.currentAnalysis;
  }

  // Check if analysis is in progress
  isAnalysisInProgress() {
    return this.isAnalyzing;
  }
}
