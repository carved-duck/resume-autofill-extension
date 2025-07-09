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

        // --------------------------------------------------
        // Make sure every part of the code can access StorageManager
        // --------------------------------------------------
        if (window.ResumeStorageManager && !window.StorageManager) {
          window.StorageManager = window.ResumeStorageManager;
        }

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
        console.log('🔍 Starting LinkedIn profile extraction...');

        const extractedData = await this.extractLinkedInProfile();
        console.log('🔍 Raw extracted data:', extractedData);

        const normalizedData = this.normalizeProfileData(extractedData);
        console.log('🔄 Normalized data:', normalizedData);

        // Save to storage with simple fallback
        try {
          if (window.storageManager?.saveResumeData) {
            await window.storageManager.saveResumeData(normalizedData, 'linkedin');
            console.log('💾 Data saved via storageManager');
          } else {
            // Direct Chrome storage fallback
            const dataToSave = {
              data: normalizedData,
              source: 'linkedin',
              timestamp: new Date().toISOString()
            };
            await chrome.storage.local.set({
              resumeData: dataToSave,
              latestResumeData: dataToSave
            });
            console.log('💾 Data saved via direct Chrome storage');
          }
        } catch (storageError) {
          console.error('❌ Storage save failed:', storageError);
          // Continue anyway - extraction was successful
        }

        sendResponse({ success: true, data: normalizedData });
      } catch (error) {
        console.error('❌ LinkedIn extraction failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    async extractLinkedInProfile() {
      console.log('🔍 Starting LinkedIn profile extraction...');

      // Load LinkedIn extractor if not available
      await this.loadLinkedInExtractor();

      if (!window.LinkedInExtractor) {
        throw new Error('LinkedIn extractor not available');
      }

      try {
        const profileData = await window.LinkedInExtractor.extractProfileData();
        console.log('✅ LinkedIn profile extracted:', profileData);
        return profileData;
      } catch (error) {
        console.error('❌ LinkedIn extraction error:', error);
        throw error;
      }
    }

    async loadLinkedInExtractor() {
      return new Promise((resolve, reject) => {
        // Create a comprehensive LinkedIn extractor inline
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
                personal_info: {},
                personal: {},       // For UI compatibility
                summary: '',
                experience: [],
                work_experience: [], // For UI compatibility
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

                // Ensure data compatibility
                profileData.personal = profileData.personal_info;
                profileData.work_experience = profileData.experience;

                console.log('✅ LinkedIn profile data extracted successfully');
                return profileData;

              } catch (error) {
                console.error('❌ Failed to extract LinkedIn data:', error);
                throw error;
              }
            }

            async extractPersonalInfo(profileData) {
              try {
                // Name - try multiple selectors
                const nameSelectors = [
                  'h1.text-heading-xlarge',
                  'h1.pv-text-details__left-panel h1',
                  '.pv-text-details__left-panel h1',
                  '.top-card-layout__title h1',
                  '.profile-photo-edit__preview-container + div h1'
                ];

                let nameElement = null;
                for (const selector of nameSelectors) {
                  nameElement = document.querySelector(selector);
                  if (nameElement) break;
                }

                if (nameElement) {
                  const fullName = nameElement.textContent.trim();
                  profileData.personal_info.full_name = fullName;
                  profileData.personal_info.name = fullName;

                  const nameParts = fullName.split(' ');
                  if (nameParts.length >= 2) {
                    profileData.personal_info.first_name = nameParts[0];
                    profileData.personal_info.last_name = nameParts[nameParts.length - 1];
                  }
                }

                // Profile headline
                const headlineSelectors = [
                  '.text-body-medium.break-words',
                  '.pv-text-details__left-panel .text-body-medium',
                  '.top-card-layout__headline',
                  '.pv-top-card--list-bullet .text-body-medium'
                ];

                let headlineElement = null;
                for (const selector of headlineSelectors) {
                  headlineElement = document.querySelector(selector);
                  if (headlineElement && headlineElement.textContent.trim().length > 10) break;
                }

                if (headlineElement) {
                  profileData.personal_info.headline = headlineElement.textContent.trim();
                }

                // Location
                const locationSelectors = [
                  '.text-body-small.inline.t-black--light.break-words',
                  '.pv-text-details__left-panel .text-body-small',
                  '.top-card__subline-item'
                ];

                let locationElement = null;
                for (const selector of locationSelectors) {
                  locationElement = document.querySelector(selector);
                  if (locationElement && locationElement.textContent.includes(',')) break;
                }

                if (locationElement) {
                  profileData.personal_info.location = locationElement.textContent.trim();
                }

                // LinkedIn URL
                profileData.personal_info.linkedin = window.location.href.split('?')[0];

                // Try to extract email from contact info (if visible)
                const emailElement = document.querySelector('[href^="mailto:"]');
                if (emailElement) {
                  profileData.personal_info.email = emailElement.href.replace('mailto:', '');
                }

                console.log('✅ Extracted personal info from LinkedIn');
              } catch (error) {
                console.warn('⚠️ Failed to extract personal info:', error);
              }
            }

            async extractSummary(profileData) {
              try {
                // About section - try multiple selectors
                const aboutSelectors = [
                  '#about ~ .pv-shared-text-with-see-more',
                  '.pv-about-section .pv-about__summary-text',
                  '[data-section="summary"] .full-width',
                  '.core-section-container__content .break-words',
                  '.pv-about__summary-text .full-width'
                ];

                let aboutSection = null;
                for (const selector of aboutSelectors) {
                  aboutSection = document.querySelector(selector);
                  if (aboutSection) break;
                }

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
                const experienceSelectors = [
                  '#experience ~ .pvs-list',
                  '.pv-profile-section.experience-section ul',
                  '[data-section="experience"] .pvs-list'
                ];

                let experienceSection = null;
                for (const selector of experienceSelectors) {
                  experienceSection = document.querySelector(selector);
                  if (experienceSection) break;
                }

                if (!experienceSection) return;

                const experienceItems = experienceSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

                for (const item of experienceItems) {
                  const experience = {};

                  // Job title
                  const titleElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__summary-info h3');
                  if (titleElement) {
                    experience.title = titleElement.textContent.trim();
                    experience.job_title = experience.title;
                  }

                  // Company
                  const companyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__secondary-title');
                  if (companyElement) {
                    experience.company = companyElement.textContent.trim();
                    experience.institution_name = experience.company;
                  }

                  // Duration
                  const durationElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__bullet-item-v2');
                  if (durationElement) {
                    experience.dates = durationElement.textContent.trim();
                    experience.duration = experience.dates;
                  }

                  // Location
                  const locationElements = item.querySelectorAll('.t-14.t-normal.t-black--light span[aria-hidden="true"]');
                  for (const locEl of locationElements) {
                    const text = locEl.textContent.trim();
                    if (text.includes(',') || text.includes('Remote')) {
                      experience.location = text;
                      break;
                    }
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
                const educationSelectors = [
                  '#education ~ .pvs-list',
                  '.pv-profile-section.education-section ul',
                  '[data-section="education"] .pvs-list'
                ];

                let educationSection = null;
                for (const selector of educationSelectors) {
                  educationSection = document.querySelector(selector);
                  if (educationSection) break;
                }

                if (!educationSection) return;

                const educationItems = educationSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

                for (const item of educationItems) {
                  const education = {};

                  // School
                  const schoolElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__school-name');
                  if (schoolElement) {
                    education.school = schoolElement.textContent.trim();
                    education.institution_name = education.school;
                  }

                  // Degree
                  const degreeElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__degree-name');
                  if (degreeElement) {
                    education.degree = degreeElement.textContent.trim();
                  }

                  // Year
                  const yearElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]');
                  if (yearElement) {
                    education.year = yearElement.textContent.trim();
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
                const skillsSelectors = [
                  '#skills ~ .pvs-list',
                  '.pv-profile-section.skills-section ul',
                  '[data-section="skills"] .pvs-list'
                ];

                let skillsSection = null;
                for (const selector of skillsSelectors) {
                  skillsSection = document.querySelector(selector);
                  if (skillsSection) break;
                }

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

    // --------------------------------------------------
    // Normalise field-names so the popup UI can render them
    // --------------------------------------------------
    normalizeProfileData(data) {
      console.log('🔄 Normalizing profile data...');

      if (!data) return {};

      // Ensure both personal_info and personal exist
      if (data.personal_info && !data.personal) {
        data.personal = data.personal_info;
      } else if (data.personal && !data.personal_info) {
        data.personal_info = data.personal;
      }

      // Ensure both experience and work_experience exist
      if (data.experience && !data.work_experience) {
        data.work_experience = data.experience;
      } else if (data.work_experience && !data.experience) {
        data.experience = data.work_experience;
      }

      // Ensure arrays exist
      if (!data.experience) data.experience = [];
      if (!data.work_experience) data.work_experience = [];
      if (!data.education) data.education = [];
      if (!data.skills) data.skills = [];

      console.log('✅ Profile data normalized');
      return data;
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

    async saveResumeData(data, source = 'unknown') {
      console.log('💾 Saving resume data with structure:', {
        source: source,
        keys: Object.keys(data),
        personal_info_keys: Object.keys(data.personal_info || {}),
        personal_keys: Object.keys(data.personal || {}),
        experience_count: data.work_experience?.length || 0,
        education_count: data.education?.length || 0
      });

      const key = `resumeData_${Date.now()}`;
      const dataToSave = {
        ...data,
        source,
        timestamp: Date.now()
      };

      try {
        await chrome.storage.local.set({ [key]: dataToSave });
        await chrome.storage.local.set({ latestResumeData: dataToSave });
        console.log('💾 Data successfully saved to storage with key:', key);
        return key;
      } catch (error) {
        console.error('❌ Failed to save resume data:', error);
        throw error;
      }
    }

    async getLatestResumeData() {
      try {
        const result = await chrome.storage.local.get('latestResumeData');
        const data = result.latestResumeData;

        console.log('📖 Retrieved latest resume data:', {
          hasData: !!data,
          keys: data ? Object.keys(data) : [],
          personal_info_keys: data?.personal_info ? Object.keys(data.personal_info) : [],
          experience_count: data?.work_experience?.length || 0
        });

        return data;
      } catch (error) {
        console.error('❌ Failed to retrieve resume data:', error);
        return null;
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

    window.testCrossTabStorage = async function() {
      try {
        console.log('🧪 Testing cross-tab storage...');
        const testData = { test: 'data', timestamp: Date.now() };
        await window.storageManager.saveResumeData(testData, 'test');
        const retrieved = await window.storageManager.getLatestResumeData();
        console.log('🧪 Storage test - saved:', testData, 'retrieved:', retrieved);
        return retrieved;
      } catch (error) {
        console.error('🧪 Storage test failed:', error);
      }
    };

    window.testLinkedInExtraction = async function() {
      try {
        console.log('🧪 Testing LinkedIn extraction...');
        const contentManager = new ContentManager();
        const extractedData = await contentManager.extractLinkedInProfile();
        console.log('🧪 Raw extracted data:', extractedData);

        const normalizedData = contentManager.normalizeProfileData(extractedData);
        console.log('🧪 Normalized data:', normalizedData);

        return normalizedData;
      } catch (error) {
        console.error('🧪 Test extraction failed:', error);
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
