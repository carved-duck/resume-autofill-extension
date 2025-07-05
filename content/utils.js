// Content Script Utilities - Notifications, Storage, and Validation
// Provides shared utilities for all content script modules

// Prevent multiple loading
if (window.resumeAutoFillUtilsLoaded) {
  console.log('⚠️ Utils module already loaded, skipping...');
} else {
  window.resumeAutoFillUtilsLoaded = true;

  console.log('🔧 Loading content script utilities...');

  // Utilities Module
  // Contains common helper functions and utilities

  class NotificationManager {
    static showNotification(message, type = 'info', duration = 5000) {
      // Create notification element
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        cursor: pointer;
      `;

      // Set background color based on type
      const colors = {
        'info': '#2196F3',
        'success': '#4CAF50',
        'warning': '#FF9800',
        'error': '#F44336'
      };

      notification.style.backgroundColor = colors[type] || colors.info;

      // Add icon based on type
      const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
      };

      notification.innerHTML = `${icons[type] || icons.info} ${message}`;

      // Add to page
      document.body.appendChild(notification);

      // Auto-remove
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.opacity = '0';
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      }, duration);

      // Click to remove
      notification.addEventListener('click', () => {
        if (notification.parentNode) {
          notification.style.opacity = '0';
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      });

      console.log(`📢 Notification (${type}): ${message}`);
    }
  }

  class DataValidator {
    static validateResumeData(data) {
      const errors = [];
      const warnings = [];

      if (!data || typeof data !== 'object') {
        errors.push('Invalid data format: must be an object');
        return { isValid: false, errors, warnings };
      }

      // Check for personal info
      if (!data.personal_info) {
        warnings.push('No personal information found');
      } else {
        const personal = data.personal_info;
        if (!personal.full_name && !personal.first_name && !personal.last_name) {
          warnings.push('No name information found');
        }
        if (!personal.email) {
          warnings.push('No email address found');
        }
        if (!personal.phone) {
          warnings.push('No phone number found');
        }
      }

      // Check for work experience
      if (!data.work_experience || !Array.isArray(data.work_experience) || data.work_experience.length === 0) {
        warnings.push('No work experience found');
      }

      // Check for education
      if (!data.education || !Array.isArray(data.education) || data.education.length === 0) {
        warnings.push('No education information found');
      }

      // Check for skills
      if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
        warnings.push('No skills information found');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    }

    static validatePageForFilling() {
      const analysis = {
        hasForm: document.querySelectorAll('form').length > 0,
        hasInputs: document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').length > 0,
        isJobSite: false,
        recommendations: []
      };

      // Check if it's a job application page
      const pageText = document.body.textContent.toLowerCase();
      const jobKeywords = ['apply', 'application', 'resume', 'cv', 'job', 'career', '応募', '求人', '履歴書'];
      analysis.isJobSite = jobKeywords.some(keyword => pageText.includes(keyword));

      if (!analysis.hasForm) {
        analysis.recommendations.push('No forms found on this page. Make sure you\'re on an application form page.');
      }

      if (!analysis.hasInputs) {
        analysis.recommendations.push('No fillable input fields found. The form may not be ready or may require interaction.');
      }

      if (!analysis.isJobSite) {
        analysis.recommendations.push('This doesn\'t appear to be a job application page. Please navigate to the application form.');
      }

      return analysis;
    }
  }

  class StorageManager {
    // Use Chrome storage API for cross-tab persistence
    static saveResumeData(data, source = 'unknown') {
      return new Promise((resolve, reject) => {
        try {
          const timestamp = new Date().toISOString();
          const storageData = {
            data: data,
            source: source, // 'linkedin', 'pdf', 'manual'
            timestamp: timestamp,
            version: '1.0'
          };

          console.log('💾 Attempting to save resume data:', {
            source: source,
            dataSize: JSON.stringify(data).length,
            timestamp: timestamp
          });

          // Save to Chrome storage (persists across tabs and sessions)
          chrome.storage.local.set({
            'resumeData': storageData,
            'lastUpdated': timestamp
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('❌ Chrome storage failed:', chrome.runtime.lastError);

              // Try background script as fallback
              console.log('🔄 Trying background script fallback...');
              chrome.runtime.sendMessage({
                action: 'saveResumeData',
                data: storageData
              }, (response) => {
                if (response && response.success) {
                  console.log('💾 Saved via background script (source: ${source})');
                  resolve(true);
                } else {
                  // Fallback to localStorage
                  try {
                    localStorage.setItem('resumeData', JSON.stringify(storageData));
                    console.log('💾 Fallback: Saved to localStorage');
                    resolve(true);
                  } catch (fallbackError) {
                    console.error('❌ All storage methods failed:', fallbackError);
                    reject(fallbackError);
                  }
                }
              });
            } else {
              console.log(`💾 Resume data saved to Chrome storage (source: ${source})`);

              // Verify the save worked by reading it back
              chrome.storage.local.get(['resumeData'], (result) => {
                if (result.resumeData) {
                  console.log('✅ Storage verification successful - data is saved');
                } else {
                  console.warn('⚠️ Storage verification failed - data not found after save');
                }
              });

              // Also save to localStorage as backup
              try {
                localStorage.setItem('resumeData', JSON.stringify(storageData));
              } catch (localError) {
                console.warn('⚠️ Failed to save to localStorage backup:', localError);
              }

              resolve(true);
            }
          });

        } catch (error) {
          console.error('❌ Failed to save resume data:', error);
          reject(error);
        }
      });
    }

    static loadResumeData() {
      return new Promise((resolve, reject) => {
        try {
          console.log('📂 Attempting to load resume data from storage...');

          // Try Chrome storage first
          chrome.storage.local.get(['resumeData', 'lastUpdated'], (result) => {
            console.log('📂 Chrome storage get result:', result);

            if (chrome.runtime.lastError) {
              console.error('❌ Chrome storage failed:', chrome.runtime.lastError);

              // Try background script as fallback
              console.log('🔄 Trying background script fallback for loading...');
              chrome.runtime.sendMessage({
                action: 'loadResumeData'
              }, (response) => {
                console.log('📂 Background script response:', response);
                if (response && response.success && response.data.resumeData) {
                  console.log(`📂 Resume data loaded via background script (source: ${response.data.resumeData.source})`);
                  resolve(response.data.resumeData);
                } else {
                  // Fallback to localStorage
                  try {
                    const localData = localStorage.getItem('resumeData');
                    console.log('📂 localStorage data:', localData);
                    if (localData) {
                      const parsed = JSON.parse(localData);
                      console.log(`📂 Fallback: Resume data loaded from localStorage (source: ${parsed.source})`);
                      resolve(parsed);
                    } else {
                      console.log('📂 No resume data found in any storage');
                      resolve(null);
                    }
                  } catch (fallbackError) {
                    console.error('❌ Failed to load from localStorage:', fallbackError);
                    resolve(null);
                  }
                }
              });
            } else {
              if (result.resumeData) {
                console.log(`📂 Resume data loaded from Chrome storage (source: ${result.resumeData.source}, updated: ${result.lastUpdated})`);
                resolve(result.resumeData);
              } else {
                console.log('📂 No data in Chrome storage, trying localStorage...');
                // Fallback to localStorage
                try {
                  const localData = localStorage.getItem('resumeData');
                  console.log('📂 localStorage data:', localData);
                  if (localData) {
                    const parsed = JSON.parse(localData);
                    console.log(`📂 Fallback: Resume data loaded from localStorage (source: ${parsed.source})`);
                    resolve(parsed);
                  } else {
                    console.log('📂 No resume data found in any storage');
                    resolve(null);
                  }
                } catch (fallbackError) {
                  console.log('📂 No resume data found in any storage');
                  resolve(null);
                }
              }
            }
          });

        } catch (error) {
          console.error('❌ Failed to load resume data:', error);
          resolve(null);
        }
      });
    }

    static clearResumeData() {
      return new Promise((resolve, reject) => {
        try {
          // Clear from Chrome storage
          chrome.storage.local.remove(['resumeData', 'lastUpdated'], () => {
            if (chrome.runtime.lastError) {
              console.error('❌ Failed to clear Chrome storage:', chrome.runtime.lastError);
            }

            // Clear from localStorage
            try {
              localStorage.removeItem('resumeData');
            } catch (localError) {
              console.warn('⚠️ Failed to clear localStorage:', localError);
            }

            console.log('🗑️ Resume data cleared from all storage');
            resolve(true);
          });
        } catch (error) {
          console.error('❌ Failed to clear resume data:', error);
          reject(error);
        }
      });
    }

    static getStorageInfo() {
      return new Promise((resolve, reject) => {
        try {
          chrome.storage.local.get(['resumeData', 'lastUpdated'], (result) => {
            if (chrome.runtime.lastError) {
              console.error('❌ Failed to get Chrome storage info:', chrome.runtime.lastError);
              resolve(null);
              return;
            }

            const localData = localStorage.getItem('resumeData');

            resolve({
              hasChromeStorage: !!result.resumeData,
              hasLocalStorage: !!localData,
              lastUpdated: result.lastUpdated || 'Never',
              source: result.resumeData?.source || 'Unknown',
              dataSize: JSON.stringify(result.resumeData || {}).length
            });
          });
        } catch (error) {
          console.error('❌ Failed to get storage info:', error);
          resolve(null);
        }
      });
    }

    // Legacy methods for backward compatibility
    static saveToLocalStorage(key, data) {
      return new Promise((resolve, reject) => {
        try {
          const serialized = JSON.stringify(data);
          localStorage.setItem(key, serialized);
          console.log(`💾 Saved to localStorage: ${key}`);
          resolve(true);
        } catch (error) {
          console.error('❌ Failed to save to localStorage:', error);
          reject(error);
        }
      });
    }

    static loadFromLocalStorage(key) {
      return new Promise((resolve, reject) => {
        try {
          const serialized = localStorage.getItem(key);
          if (serialized) {
            const data = JSON.parse(serialized);
            console.log(`📂 Loaded from localStorage: ${key}`);
            resolve(data);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('❌ Failed to load from localStorage:', error);
          reject(error);
        }
      });
    }

    static clearLocalStorage(key) {
      return new Promise((resolve, reject) => {
        try {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared from localStorage: ${key}`);
          resolve(true);
        } catch (error) {
          console.error('❌ Failed to clear localStorage:', error);
          reject(error);
        }
      });
    }

    // Test function to manually verify storage
    static testStorage() {
      console.log('🧪 Testing storage functionality...');

      const testData = {
        data: {
          personal_info: {
            full_name: "Test User",
            email: "test@example.com"
          }
        },
        source: 'test',
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Test save
      this.saveResumeData(testData.data, 'test').then(() => {
        console.log('✅ Test save successful');

        // Test load
        this.loadResumeData().then((loadedData) => {
          if (loadedData && loadedData.data) {
            console.log('✅ Test load successful:', loadedData.source);
          } else {
            console.log('❌ Test load failed - no data found');
          }
        }).catch((error) => {
          console.error('❌ Test load error:', error);
        });
      }).catch((error) => {
        console.error('❌ Test save error:', error);
      });
    }
  }

  class DebugHelper {
    static logPageInfo() {
      console.group('🔍 Page Debug Information');
      console.log('URL:', window.location.href);
      console.log('Title:', document.title);
      console.log('Forms:', document.querySelectorAll('form').length);
      console.log('Text Inputs:', document.querySelectorAll('input[type="text"]').length);
      console.log('Email Inputs:', document.querySelectorAll('input[type="email"]').length);
      console.log('Tel Inputs:', document.querySelectorAll('input[type="tel"]').length);
      console.log('Textareas:', document.querySelectorAll('textarea').length);
      console.log('Select Elements:', document.querySelectorAll('select').length);
      console.log('Buttons:', document.querySelectorAll('button, input[type="submit"]').length);
      console.groupEnd();
    }

    static highlightFields(fieldType = null) {
      // Remove existing highlights
      document.querySelectorAll('.resume-autofill-highlight').forEach(el => {
        el.classList.remove('resume-autofill-highlight');
      });

      // Add new highlights
      let selector = 'input[type="text"], input[type="email"], input[type="tel"], textarea, select';
      if (fieldType && window.FIELD_SELECTORS && window.FIELD_SELECTORS[fieldType]) {
        selector = window.FIELD_SELECTORS[fieldType].join(', ');
      }

      const style = document.createElement('style');
      style.textContent = `
        .resume-autofill-highlight {
          outline: 3px solid #ff6b35 !important;
          outline-offset: 2px !important;
          background-color: rgba(255, 107, 53, 0.1) !important;
          transition: all 0.3s ease !important;
        }
      `;
      document.head.appendChild(style);

      document.querySelectorAll(selector).forEach(field => {
        if (field.offsetParent !== null) { // Only visible elements
          field.classList.add('resume-autofill-highlight');
        }
      });

      console.log(`🎯 Highlighted ${document.querySelectorAll('.resume-autofill-highlight').length} fields for: ${fieldType || 'all fields'}`);

      // Auto-remove highlights after 5 seconds
      setTimeout(() => {
        document.querySelectorAll('.resume-autofill-highlight').forEach(el => {
          el.classList.remove('resume-autofill-highlight');
        });
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 5000);
    }
  }

  class EventManager {
    static setupMessageListeners() {
      // Only set up listeners if not already set
      if (!window.resumeAutoFillEventListenersSet) {
        window.resumeAutoFillEventListenersSet = true;

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('📨 Content script received message:', message);

          switch (message.action) {
            case 'ping':
              // Simple ping to check if content script is ready
              sendResponse({
                success: true,
                message: 'Content script is active',
                features: ['fillForm', 'extractLinkedIn', 'analyzePageStructure'],
                ready: true
              });
              break;

            case 'showNotification':
              NotificationManager.showNotification(message.text, message.type);
              sendResponse({ success: true });
              break;

            case 'validatePage':
              const validation = DataValidator.validatePageForFilling();
              sendResponse({ success: true, validation });
              break;

            case 'debugPage':
              DebugHelper.logPageInfo();
              sendResponse({ success: true });
              break;

            case 'highlightFields':
              DebugHelper.highlightFields(message.fieldType);
              sendResponse({ success: true });
              break;

            case 'fillForm':
              if (window.formFiller) {
                const result = window.formFiller.fillFormWithResumeData(message.data);
                sendResponse({ success: true, result });
              } else {
                sendResponse({ success: false, error: 'Form filler not initialized' });
              }
              break;

            case 'storageChanged':
              // Handle storage change notifications (can be ignored for now)
              console.log('📦 Storage changed:', message.changes);
              sendResponse({ success: true });
              break;

            default:
              // Let other modules handle their specific messages
              console.log('📨 Message not handled by EventManager, passing to other modules');
              return false; // Let other listeners handle it
          }

          return true; // Indicate async response
        });
      }
    }
  }

    // Export to global scope
  window.NotificationManager = NotificationManager;
  window.DataValidator = DataValidator;
  window.ResumeStorageManager = StorageManager;
  window.DebugHelper = DebugHelper;
  window.EventManager = EventManager;

  // Auto-setup event listeners
  EventManager.setupMessageListeners();

  console.log('🛠️ Utilities module loaded');
}
