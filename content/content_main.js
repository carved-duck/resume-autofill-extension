// Enhanced Content Script - Main Orchestrator
// Clean, modular version that coordinates all functionality

// Prevent multiple loading
if (window.resumeAutoFillContentScriptLoaded) {
  console.log('⚠️ Content script already loaded, skipping...');
} else {
  window.resumeAutoFillContentScriptLoaded = true;

  console.log('🚀 Resume Auto-Fill Extension - Content Script Loaded');

  class ContentScriptOrchestrator {
    constructor() {
      this.resumeData = null;
      this.formFiller = null;
      this.isInitialized = false;
    }

    async initialize() {
      if (this.isInitialized) return;

      console.log('🔧 Initializing content script orchestrator...');

      try {
        // Wait for modules to be loaded
        await this.waitForModules();

        // Initialize form filler
        this.formFiller = new window.FormFiller();

        // Set up message listeners
        this.setupMessageListeners();

        // Start page monitoring
        if (window.pageAnalyzer) {
          window.pageAnalyzer.startDynamicMonitoring();
        }

        this.isInitialized = true;
        console.log('✅ Content script orchestrator initialized successfully');

        // Show initialization notification
        window.NotificationManager?.showNotification(
          'Resume Auto-Fill extension is ready!',
          'success',
          3000
        );

      } catch (error) {
        console.error('❌ Failed to initialize content script:', error);
        window.NotificationManager?.showNotification(
          'Failed to initialize auto-fill extension',
          'error'
        );
      }
    }

    async waitForModules() {
      const maxWaitTime = 5000; // 5 seconds
      const checkInterval = 100; // 100ms
      let waitTime = 0;

      return new Promise((resolve, reject) => {
        const checkModules = () => {
          const required = [
            'FIELD_SELECTORS',
            'SITE_SPECIFIC_SELECTORS',
            'FormFiller',
            'PageAnalyzer',
            'NotificationManager',
            'ResumeStorageManager'
          ];

          const allLoaded = required.every(module => window[module]);

          if (allLoaded) {
            console.log('📦 All modules loaded successfully');
            resolve();
          } else if (waitTime >= maxWaitTime) {
            console.warn('⚠️ Module loading timeout, some features may not work');
            resolve(); // Continue anyway
          } else {
            waitTime += checkInterval;
            setTimeout(checkModules, checkInterval);
          }
        };

        checkModules();
      });
    }

    setupMessageListeners() {
      // Only set up listeners if not already set
      if (!window.resumeAutoFillListenersSet) {
        window.resumeAutoFillListenersSet = true;

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('📨 Main orchestrator received message:', message);

          switch (message.action) {
            case 'fillForm':
              this.handleFillForm(message, sendResponse);
              break;

            case 'extractLinkedIn':
              this.handleLinkedInExtraction(sendResponse);
              break;

            case 'analyzePageStructure':
              this.handlePageAnalysis(sendResponse);
              break;

            case 'ping':
              sendResponse({
                success: true,
                message: 'Content script is active',
                features: ['fillForm', 'extractLinkedIn', 'analyzePageStructure'],
                ready: this.isInitialized
              });
              break;

            default:
              // Let other modules handle their specific messages
              return false;
          }

          return true; // Indicate async response
        });
      }
    }

    async handleFillForm(message, sendResponse) {
      try {
        console.log('📝 Handling form fill request...');

        if (!this.formFiller) {
          throw new Error('Form filler not initialized');
        }

        let resumeData = message.data;

        // If no data provided, try to load from storage
        if (!resumeData) {
          console.log('📂 No data provided, attempting to load from storage...');

          try {
            const storedData = await window.ResumeStorageManager?.loadResumeData();
            console.log('📂 Storage load result:', storedData);

            if (storedData && storedData.data) {
              resumeData = storedData.data;
              console.log(`📂 Using stored resume data (source: ${storedData.source}, updated: ${storedData.timestamp})`);

              window.NotificationManager?.showNotification(
                `Using stored resume data from ${storedData.source}`,
                'info',
                3000
              );
            } else {
              console.log('📂 No stored data found or invalid format');
              throw new Error('No resume data available. Please extract from LinkedIn or upload a PDF first.');
            }
          } catch (storageError) {
            console.error('❌ Storage load error:', storageError);
            throw new Error('Failed to load stored resume data. Please extract from LinkedIn or upload a PDF first.');
          }
        }

        // Validate the page first
        const pageValidation = window.DataValidator?.validatePageForFilling();
        if (pageValidation && !pageValidation.hasInputs) {
          throw new Error('No fillable fields found on this page');
        }

        // Validate resume data
        const dataValidation = window.DataValidator?.validateResumeData(resumeData);
        if (dataValidation && !dataValidation.isValid) {
          throw new Error(`Invalid resume data: ${dataValidation.errors.join(', ')}`);
        }

        // Store the data for this session
        this.resumeData = resumeData;

        // Fill the form
        const result = this.formFiller.fillFormWithResumeData(resumeData);

        // Show result notification
        if (result.success) {
          window.NotificationManager?.showNotification(
            `Successfully filled ${result.fieldsCount} fields!`,
            'success'
          );
        } else {
          window.NotificationManager?.showNotification(
            `Form filling failed: ${result.message}`,
            'warning'
          );
        }

        sendResponse({ success: true, result });

      } catch (error) {
        console.error('❌ Form filling error:', error);

        window.NotificationManager?.showNotification(
          `Error: ${error.message}`,
          'error'
        );

        sendResponse({
          success: false,
          error: error.message,
          result: { success: false, fieldsCount: 0, message: error.message }
        });
      }
    }

    async handleLinkedInExtraction(sendResponse) {
      try {
        console.log('🔗 Handling LinkedIn extraction...');

        if (!window.location.hostname.includes('linkedin.com')) {
          throw new Error('Not on LinkedIn - please navigate to your LinkedIn profile first');
        }

        // Check if LinkedIn extractor is available
        if (!window.LinkedInExtractor) {
          // Try to load the LinkedIn extractor
          await this.loadLinkedInExtractor();
        }

        if (window.LinkedInExtractor) {
          console.log('🔍 Starting LinkedIn profile extraction...');
          const extractedData = await window.LinkedInExtractor.extractProfileData();

          console.log('📊 Extracted data:', extractedData);

                    // Save extracted data to storage
          console.log('🔍 Checking storage availability...');
          console.log('StorageManager available:', !!StorageManager);
          console.log('Extracted data available:', !!extractedData);

          if (extractedData && StorageManager) {
            try {
              console.log('💾 Saving LinkedIn data to storage...');
              console.log('Data to save:', extractedData);
              await StorageManager.saveResumeData(extractedData, 'linkedin');
              console.log('✅ LinkedIn data saved to storage for cross-tab access');

              // Verify the save worked
              const savedData = await StorageManager.loadResumeData();
              console.log('📂 Verification - saved data:', savedData);
            } catch (saveError) {
              console.error('❌ Failed to save LinkedIn data to storage:', saveError);
              // Continue anyway - data is still in memory
            }
          } else {
            console.warn('⚠️ No extracted data or StorageManager not available');
            console.log('StorageManager:', StorageManager);
            console.log('Extracted data:', extractedData);
          }

          // Store in current session
          this.resumeData = extractedData;

          window.NotificationManager?.showNotification(
            'LinkedIn profile data extracted and saved!',
            'success'
          );

          sendResponse({ success: true, data: extractedData });
        } else {
          throw new Error('LinkedIn extractor not available');
        }

      } catch (error) {
        console.error('❌ LinkedIn extraction error:', error);

        window.NotificationManager?.showNotification(
          `LinkedIn extraction failed: ${error.message}`,
          'error'
        );

        sendResponse({ success: false, error: error.message });
      }
    }

        async loadLinkedInExtractor() {
      return new Promise((resolve, reject) => {
        // Create a simple LinkedIn extractor inline to avoid module loading issues
        if (!window.LinkedInExtractor) {
          class SimpleLinkedInExtractor {
            constructor() {
              this.isLinkedInPage = window.location.hostname.includes('linkedin.com');
            }

            async extractProfileData() {
              if (!this.isLinkedInPage) {
                throw new Error('Not on LinkedIn page');
              }

              console.log('🔍 Extracting LinkedIn profile data...');

              const profileData = {
                personal: {},
                summary: '',
                experience: [],
                education: [],
                skills: [],
                projects: [],
                languages: [],
                certifications: []
              };

              try {
                // Extract personal information
                await this.extractPersonalInfo(profileData);

                // Extract summary/about section
                await this.extractSummary(profileData);

                // Extract experience
                await this.extractExperience(profileData);

                // Extract education
                await this.extractEducation(profileData);

                // Extract skills
                await this.extractSkills(profileData);

                console.log('✅ LinkedIn profile data extracted successfully');
                return profileData;

              } catch (error) {
                console.error('❌ Failed to extract LinkedIn data:', error);
                throw error;
              }
            }

            async extractPersonalInfo(profileData) {
              try {
                // Name
                const nameElement = document.querySelector('h1.text-heading-xlarge, h1.pv-text-details__left-panel h1');
                if (nameElement) {
                  const fullName = nameElement.textContent.trim();
                  profileData.personal.full_name = fullName;

                  const nameParts = fullName.split(' ');
                  if (nameParts.length >= 2) {
                    profileData.personal.first_name = nameParts[0];
                    profileData.personal.last_name = nameParts[nameParts.length - 1];
                  }
                }

                // Profile headline
                const headlineElement = document.querySelector('.text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium');
                if (headlineElement) {
                  profileData.personal.headline = headlineElement.textContent.trim();
                }

                // Location
                const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel .text-body-small');
                if (locationElement) {
                  profileData.personal.location = locationElement.textContent.trim();
                }

                // LinkedIn URL
                profileData.personal.linkedin = window.location.href.split('?')[0];

                console.log('✅ Extracted personal info from LinkedIn');
              } catch (error) {
                console.warn('⚠️ Failed to extract personal info:', error);
              }
            }

            async extractSummary(profileData) {
              try {
                // About section
                const aboutSection = document.querySelector('#about ~ .pv-shared-text-with-see-more, .pv-about-section .pv-about__summary-text');
                if (aboutSection) {
                  // Click "see more" if present
                  const seeMoreButton = aboutSection.querySelector('button[aria-label*="see more"], .inline-show-more-text__button');
                  if (seeMoreButton) {
                    seeMoreButton.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }

                  const summaryText = aboutSection.textContent.trim();
                  if (summaryText && summaryText.length > 20) {
                    profileData.summary = summaryText;
                  }
                }

                console.log('✅ Extracted summary from LinkedIn');
              } catch (error) {
                console.warn('⚠️ Failed to extract summary:', error);
              }
            }

            async extractExperience(profileData) {
              try {
                const experienceSection = document.querySelector('#experience ~ .pvs-list, .pv-profile-section.experience-section');
                if (!experienceSection) return;

                const experienceItems = experienceSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

                for (const item of experienceItems) {
                  const experience = {};

                  // Job title
                  const titleElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__summary-info h3');
                  if (titleElement) {
                    experience.title = titleElement.textContent.trim();
                  }

                  // Company
                  const companyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__secondary-title');
                  if (companyElement) {
                    experience.company = companyElement.textContent.trim();
                  }

                  // Duration
                  const durationElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__bullet-item-v2');
                  if (durationElement) {
                    experience.dates = durationElement.textContent.trim();
                  }

                  if (experience.title || experience.company) {
                    profileData.experience.push(experience);
                  }
                }

                console.log(`✅ Extracted ${profileData.experience.length} experience entries from LinkedIn`);
              } catch (error) {
                console.warn('⚠️ Failed to extract experience:', error);
              }
            }

            async extractEducation(profileData) {
              try {
                const educationSection = document.querySelector('#education ~ .pvs-list, .pv-profile-section.education-section');
                if (!educationSection) return;

                const educationItems = educationSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

                for (const item of educationItems) {
                  const education = {};

                  // School
                  const schoolElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__school-name');
                  if (schoolElement) {
                    education.school = schoolElement.textContent.trim();
                  }

                  // Degree
                  const degreeElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__degree-name');
                  if (degreeElement) {
                    education.degree = degreeElement.textContent.trim();
                  }

                  if (education.school || education.degree) {
                    profileData.education.push(education);
                  }
                }

                console.log(`✅ Extracted ${profileData.education.length} education entries from LinkedIn`);
              } catch (error) {
                console.warn('⚠️ Failed to extract education:', error);
              }
            }

            async extractSkills(profileData) {
              try {
                const skillsSection = document.querySelector('#skills ~ .pvs-list, .pv-profile-section.skills-section');
                if (!skillsSection) return;

                const skillElements = skillsSection.querySelectorAll('.mr1.t-bold span[aria-hidden="true"], .pv-skill-category-entity__name');

                for (const skillElement of skillElements) {
                  const skill = skillElement.textContent.trim();
                  if (skill && skill.length > 1) {
                    profileData.skills.push(skill);
                  }
                }

                console.log(`✅ Extracted ${profileData.skills.length} skills from LinkedIn`);
              } catch (error) {
                console.warn('⚠️ Failed to extract skills:', error);
              }
            }
          }

          window.LinkedInExtractor = new SimpleLinkedInExtractor();
          console.log('✅ LinkedIn extractor created and exposed to global scope');
        }

        resolve();
      });
    }

    async handlePageAnalysis(sendResponse) {
      try {
        console.log('🔍 Handling page analysis...');

        let analysis = null;

        if (window.PageStructureAnalyzer) {
          analysis = await window.PageStructureAnalyzer.analyzePageStructure();
        }

        if (window.pageAnalyzer) {
          const dynamicAnalysis = await window.pageAnalyzer.analyzePageDynamically();
          if (dynamicAnalysis) {
            analysis = { ...analysis, ...dynamicAnalysis };
          }
        }

        sendResponse({ success: true, analysis });

      } catch (error) {
        console.error('❌ Page analysis error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    // Public methods for debugging
    debugPage() {
      window.DebugHelper?.logPageInfo();
    }

    highlightFields(fieldType = null) {
      window.DebugHelper?.highlightFields(fieldType);
    }

    testFillWithSampleData() {
      const sampleData = {
        personal_info: {
          full_name: "John Doe",
          email: "john.doe@example.com",
          phone: "+1-555-0123",
          address: "123 Main St, Anytown, USA"
        },
        work_experience: [{
          title: "Software Engineer",
          company: "Tech Corp",
          start_date: "2020-01",
          end_date: "2023-12"
        }],
        education: [{
          institution: "University of Technology",
          degree: "Bachelor of Science in Computer Science",
          graduation_date: "2020"
        }],
        skills: ["JavaScript", "Python", "React", "Node.js"]
      };

      if (this.formFiller) {
        return this.formFiller.fillFormWithResumeData(sampleData);
      } else {
        console.error('Form filler not initialized');
        return null;
      }
    }
  }

  // Only initialize if not already done
  if (!window.contentScriptOrchestrator) {
    // Initialize the orchestrator
    const orchestrator = new ContentScriptOrchestrator();

    // Wait for DOM to be ready, then initialize
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => orchestrator.initialize());
    } else {
      orchestrator.initialize();
    }

    // Export to global scope for debugging
    window.contentScriptOrchestrator = orchestrator;

    // Add global test functions for debugging
    window.testStorage = () => {
      console.log('🧪 Testing storage from content script...');
      if (StorageManager) {
        StorageManager.testStorage();
      } else {
        console.error('❌ StorageManager not available');
      }
    };

    window.testCrossTabStorage = () => {
      console.log('🧪 Testing cross-tab storage...');

      // Test direct Chrome storage
      chrome.storage.local.get(['resumeData'], (result) => {
        console.log('📂 Direct Chrome storage test:', result);
      });

      // Test background script
      chrome.runtime.sendMessage({action: 'getStorageInfo'}, (response) => {
        console.log('📂 Background storage info:', response);
      });

      // Test localStorage
      const localData = localStorage.getItem('resumeData');
      console.log('📂 localStorage test:', localData ? JSON.parse(localData) : 'No data');

      // Test StorageManager
      if (StorageManager) {
        StorageManager.loadResumeData().then((data) => {
          console.log('📂 StorageManager test:', data);
        }).catch((error) => {
          console.error('❌ StorageManager test failed:', error);
        });
      } else {
        console.error('❌ StorageManager not available');
      }
    };

        window.testLinkedInExtraction = () => {
      console.log('🧪 Testing LinkedIn extraction...');
      if (window.LinkedInExtractor) {
        console.log('✅ LinkedInExtractor is available');
        window.LinkedInExtractor.extractProfileData().then((data) => {
          console.log('📊 Extracted data:', data);
          if (data && StorageManager) {
            console.log('💾 Attempting to save data...');
            StorageManager.saveResumeData(data, 'linkedin').then(() => {
              console.log('✅ Data saved successfully');

              // Verify the save
              StorageManager.loadResumeData().then((savedData) => {
                console.log('📂 Verification - loaded data:', savedData);
              });
            }).catch((error) => {
              console.error('❌ Failed to save data:', error);
            });
          } else {
            console.error('❌ No data or StorageManager not available');
            console.log('Data:', data);
            console.log('StorageManager:', StorageManager);
          }
        }).catch((error) => {
          console.error('❌ Extraction failed:', error);
        });
      } else {
        console.error('❌ LinkedInExtractor not available');
      }
    };

    window.testStorageDirectly = () => {
      console.log('🧪 Testing storage directly...');
      if (StorageManager) {
        const testData = {
          personal: { full_name: 'Test User' },
          summary: 'Test summary',
          experience: [],
          education: [],
          skills: []
        };

        console.log('💾 Saving test data...');
        StorageManager.saveResumeData(testData, 'test').then(() => {
          console.log('✅ Test data saved');

          StorageManager.loadResumeData().then((loadedData) => {
            console.log('📂 Loaded test data:', loadedData);
          });
        }).catch((error) => {
          console.error('❌ Failed to save test data:', error);
        });
      } else {
        console.error('❌ StorageManager not available');
      }
    };

    // Legacy compatibility for popup.js
    window.fillFormWithResumeData = (data) => {
      if (orchestrator.formFiller) {
        return orchestrator.formFiller.fillFormWithResumeData(data);
      } else {
        console.error('Form filler not initialized');
        return { success: false, fieldsCount: 0, message: 'Form filler not initialized' };
      }
    };

    console.log('🎭 Content script orchestrator ready');
  } else {
    console.log('🔄 Content script orchestrator already exists, using existing instance');
  }
}
