// Enhanced Content Script - Main Orchestrator
// Clean, modular version that coordinates all functionality

// Import logging system
if (!window.logger) {
  // Load config first
  const configScript = document.createElement('script');
  configScript.src = chrome.runtime.getURL('js/modules/logConfig.js');
  document.head.appendChild(configScript);
  
  // Then load logger
  const loggerScript = document.createElement('script');
  loggerScript.src = chrome.runtime.getURL('js/modules/logger.js');
  document.head.appendChild(loggerScript);
}

// Prevent multiple loading
if (window.resumeAutoFillContentScriptLoaded) {
  console.warn('⚠️ Content script already loaded, skipping...');
} else {
  window.resumeAutoFillContentScriptLoaded = true;

  // Use logger when available, fallback to console
  const log = window.logger || console;
  log.info?.('Content Script Loaded') || console.log('🚀 Resume Auto-Fill Extension - Content Script Loaded');

  class ContentScriptOrchestrator {
    constructor() {
      this.resumeData = null;
      this.formFiller = null;
      this.isInitialized = false;
    }

    async initialize() {
      if (this.isInitialized) return;

      const log = window.logger || console;
      log.debug?.('Initializing orchestrator') || console.log('🔧 Initializing content script orchestrator...');

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
        const log = window.logger || console;
        log.info?.('Orchestrator initialized') || console.log('✅ Content script orchestrator initialized successfully');

        // Show initialization notification
        window.NotificationManager?.showNotification(
          'Resume Auto-Fill extension is ready!',
          'success',
          3000
        );

      } catch (error) {
        console.error('❌ Failed to initialize content script:', error);
        this.initializationError = error.message;
        
        // Set up basic message listener even if initialization fails
        this.setupBasicMessageListener();
        
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

          // Validate sender and message format
          if (!sender || sender.id !== chrome.runtime.id) {
            console.warn('Message from unauthorized sender:', sender);
            sendResponse({ success: false, error: 'Unauthorized sender' });
            return false;
          }

          if (!message || typeof message.action !== 'string') {
            console.warn('Invalid message format:', message);
            sendResponse({ success: false, error: 'Invalid message format' });
            return false;
          }

          switch (message.action) {
            case 'fillForm':
              this.handleFillForm(message, sendResponse);
              return true; // Keep message channel open for async response

            case 'extractLinkedIn':
              this.handleLinkedInExtraction(message, sendResponse).catch(error => {
                console.error('❌ Unhandled error in LinkedIn extraction:', error);
                sendResponse({ success: false, error: error.message });
              });
              return true; // Keep message channel open for async response
              
            case 'testHybridExtraction':
            case 'testEnhancedExtraction':
              this.handleHybridTest(sendResponse).catch(error => {
                console.error('❌ Unhandled error in enhanced test:', error);
                sendResponse({ success: false, error: error.message });
              });
              return true; // Keep message channel open for async response

            case 'debugLinkedIn':
              this.handleLinkedInDebug(sendResponse);
              return true; // Keep message channel open for async response

            case 'analyzePageStructure':
              this.handlePageAnalysis(sendResponse);
              return true; // Keep message channel open for async response

            case 'ping':
              sendResponse({
                success: true,
                message: 'Content script is active',
                features: ['fillForm', 'extractLinkedIn', 'testEnhancedExtraction', 'debugLinkedIn', 'analyzePageStructure'],
                ready: this.isInitialized,
                error: this.initializationError || null,
                timestamp: new Date().toISOString()
              });
              return false; // Synchronous response, close channel

            default:
              // Let other modules handle their specific messages
              return false;
          }

          return true; // Indicate async response
        });
      }
    }

    setupBasicMessageListener() {
      // Set up a basic message listener even if full initialization fails
      if (!window.resumeAutoFillBasicListenersSet) {
        window.resumeAutoFillBasicListenersSet = true;
        
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('📨 Basic message listener received:', message);
          
          if (message.action === 'ping') {
            sendResponse({
              success: true,
              message: 'Content script loaded but not fully initialized',
              features: [],
              ready: false,
              error: this.initializationError || 'Initialization failed',
              timestamp: new Date().toISOString()
            });
            return true;
          }
          
          // For other actions, indicate not ready
          sendResponse({
            success: false,
            error: 'Content script not ready: ' + (this.initializationError || 'Unknown error'),
            ready: false
          });
          return true;
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

    async handleLinkedInExtraction(message, sendResponse) {
      try {
        const useEnhancement = message.useHybridMode || message.useEnhancement || false;
        console.log(`🔍 Starting LinkedIn profile extraction... (Enhancement: ${useEnhancement})`);

        // Check if we're actually on LinkedIn
        if (!window.location.hostname.includes('linkedin.com')) {
          throw new Error('This feature only works on LinkedIn profile pages. Please navigate to a LinkedIn profile first.');
        }

        // Check if content script is fully initialized
        if (!this.isInitialized) {
          throw new Error('Content script not fully initialized: ' + (this.initializationError || 'Unknown error'));
        }

        const log = window.logger || console;
        const extractedData = await this.extractLinkedInProfile(useEnhancement);
        log.debug?.('Raw data extracted', extractedData) || console.log('🔍 Raw extracted data:', JSON.stringify(extractedData, null, 2));

        const normalizedData = this.normalizeProfileData(extractedData);
        log.debug?.('Data normalized', normalizedData) || console.log('🔄 Normalized data:', JSON.stringify(normalizedData, null, 2));

        // Concise data structure summary
        const summary = {
          personal: !!normalizedData.personal_info,
          experience: normalizedData.work_experience?.length || 0,
          education: normalizedData.education?.length || 0,
          skills: normalizedData.skills?.length || 0,
          summary: normalizedData.summary?.length || 0
        };
        log.info?.('Profile extracted', summary) || console.log('📊 Data structure analysis:', {
          hasPersonalInfo: !!normalizedData.personal_info,
          hasPersonal: !!normalizedData.personal,
          personalInfoKeys: Object.keys(normalizedData.personal_info || {}),
          personalKeys: Object.keys(normalizedData.personal || {}),
          hasWorkExperience: !!normalizedData.work_experience,
          workExperienceCount: normalizedData.work_experience?.length || 0,
          hasEducation: !!normalizedData.education,
          educationCount: normalizedData.education?.length || 0,
          hasSkills: !!normalizedData.skills,
          skillsCount: normalizedData.skills?.length || 0,
          hasSummary: !!normalizedData.summary,
          summaryLength: normalizedData.summary?.length || 0
        });

        // Save to storage with simple fallback
        try {
          if (window.storageManager?.saveResumeData) {
            await window.storageManager.saveResumeData(normalizedData, 'linkedin');
            log.success?.('Data saved via storageManager') || console.log('💾 Data saved via storageManager');
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
            log.success?.('Data saved via direct storage') || console.log('💾 Data saved via direct Chrome storage');
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

    async handleLinkedInDebug(sendResponse) {
      try {
        console.log('🔍 Starting LinkedIn page debug...');
        
        // Check if we're actually on LinkedIn
        if (!window.location.hostname.includes('linkedin.com')) {
          throw new Error('This feature only works on LinkedIn profile pages. Please navigate to a LinkedIn profile first.');
        }

        // Load LinkedIn extractor if not available
        await this.loadLinkedInExtractor();

        if (!window.LinkedInExtractor) {
          throw new Error('LinkedIn extractor not available');
        }

        // Create extractor and run debug
        const extractor = new window.LinkedInExtractor();
        const debugData = extractor.debugPageStructure();
        
        console.log('✅ LinkedIn debug completed');
        sendResponse({ success: true, debugData: debugData });
        
      } catch (error) {
        console.error('❌ LinkedIn debug failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    async handleHybridTest(sendResponse) {
      try {
        console.log('🧪 Starting enhanced vs traditional comparison test...');
        
        // Check if we're actually on LinkedIn
        if (!window.location.hostname.includes('linkedin.com')) {
          throw new Error('This feature only works on LinkedIn profile pages. Please navigate to a LinkedIn profile first.');
        }

        // Load traditional extractor
        await this.loadLinkedInExtractor();
        
        // Run traditional extraction
        const extractor = new window.LinkedInExtractor();
        const traditionalData = await extractor.extractProfileData();
        
        // Apply smart enhancements
        const { enhanceLinkedInData, shouldApplyEnhancements } = await import(chrome.runtime.getURL('js/modules/smartEnhancer.js'));
        
        let enhancedData = traditionalData;
        if (shouldApplyEnhancements(traditionalData)) {
          enhancedData = await enhanceLinkedInData(traditionalData);
        }
        
        const comparison = { 
          traditional: traditionalData, 
          enhanced: enhancedData,
          improvements: enhancedData.enhancement_metrics || {}
        };
        
        console.log('✅ Enhanced comparison test completed');
        sendResponse({ 
          success: true, 
          comparison: comparison,
          message: 'Check console for detailed comparison results'
        });
        
      } catch (error) {
        console.error('❌ Enhanced test failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    async extractLinkedInProfile(useEnhancement = false) {
      console.log(`🔍 Starting LinkedIn profile extraction... (Enhancement: ${useEnhancement})`);

      // Load traditional extractor
      await this.loadLinkedInExtractor();

      if (!window.LinkedInExtractor) {
        throw new Error('LinkedIn extractor not available');
      }

      try {
        const extractor = new window.LinkedInExtractor();
        const profileData = await extractor.extractProfileData();
        console.log('✅ Traditional LinkedIn profile extracted:', profileData);

        // Apply smart enhancements if requested
        if (useEnhancement) {
          try {
            console.log('🤖 Applying smart enhancements...');
            
            const { enhanceLinkedInData, shouldApplyEnhancements } = await import(chrome.runtime.getURL('js/modules/smartEnhancer.js'));
            
            if (shouldApplyEnhancements(profileData)) {
              const enhancedData = await enhanceLinkedInData(profileData);
              console.log('✅ Smart enhancements applied:', enhancedData);
              return enhancedData;
            } else {
              console.log('ℹ️ No enhancements needed, using traditional data');
            }
          } catch (error) {
            console.warn('⚠️ Enhancement failed, using traditional data:', error);
          }
        }

        return profileData;
      } catch (error) {
        console.error('❌ LinkedIn extraction error:', error);
        throw error;
      }
    }


    async loadLinkedInExtractor() {
      if (window.LinkedInExtractor) {
        console.log('✅ LinkedIn extractor already loaded');
        return;
      }

      try {
        console.log('📦 Loading LinkedIn extractor via direct import...');
        // Use direct import - CSP compliant
        const module = await import(chrome.runtime.getURL('js/modules/linkedinExtractor.js'));
        window.LinkedInExtractor = module.LinkedInExtractor;
        console.log('✅ LinkedIn extractor loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load LinkedIn extractor:', error);
        this.createFallbackExtractor();
      }
    }

    createFallbackExtractor() {
      console.log('⚠️ Creating fallback LinkedIn extractor');
      
      // Create a simpler fallback extractor
      class FallbackLinkedInExtractor {
        constructor() {
          this.isLinkedInPage = window.location.hostname.includes('linkedin.com');
        }

        async extractProfileData() {
          if (!this.isLinkedInPage) {
            throw new Error('Not on LinkedIn page');
          }

          console.log('🔍 Using fallback LinkedIn extractor...');

          const profileData = {
            personal_info: {},
            personal: {},
            summary: '',
            experience: [],
            work_experience: [],
            education: [],
            skills: [],
            projects: [],
            languages: [],
            certifications: []
          };

          // Extract name
          const nameElement = document.querySelector('h1.text-heading-xlarge, h1');
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

          // Extract headline
          const headlineElement = document.querySelector('.text-body-medium.break-words');
          if (headlineElement) {
            profileData.personal_info.headline = headlineElement.textContent.trim();
          }

          // Extract location
          const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words');
          if (locationElement) {
            profileData.personal_info.location = locationElement.textContent.trim();
          }

          // Set LinkedIn URL
          profileData.personal_info.linkedin = window.location.href.split('?')[0];

          // Ensure data compatibility
          profileData.personal = profileData.personal_info;
          profileData.work_experience = profileData.experience;

          console.log('✅ Fallback LinkedIn profile data extracted');
          return profileData;
        }

        debugPageStructure() {
          console.log('🔍 DEBUG: Analyzing LinkedIn page structure (Fallback Extractor)...');
          
          const sections = {
            about: document.querySelector('#about'),
            experience: document.querySelector('#experience'),
            education: document.querySelector('#education'),
            skills: document.querySelector('#skills'),
            name: document.querySelector('h1.text-heading-xlarge'),
            headline: document.querySelector('.text-body-medium.break-words'),
            location: document.querySelector('.text-body-small.inline.t-black--light.break-words')
          };

          console.log('📍 Section availability:', Object.entries(sections).map(([key, el]) => 
            `${key}: ${el ? '✅' : '❌'}`
          ).join(', '));

          // Debug experience section in detail
          if (sections.experience) {
            console.log('💼 Experience section detailed analysis:');
            
            const expContainers = [
              '#experience + div',
              '#experience ~ div', 
              '#experience + section',
              '#experience ~ section'
            ];
            
            for (const selector of expContainers) {
              const container = document.querySelector(selector);
              if (container) {
                console.log(`📦 Found experience container with selector "${selector}"`);
                console.log(`   - Text preview: "${container.textContent?.substring(0, 150)}..."`);
                console.log(`   - Child elements: ${container.children.length}`);
                console.log(`   - Has .pvs-list__item--line-separated: ${container.querySelectorAll('.pvs-list__item--line-separated').length}`);
                console.log(`   - Has .pvs-entity__path-node: ${container.querySelectorAll('.pvs-entity__path-node').length}`);
              }
            }
          }

          // Debug skills section
          if (sections.skills) {
            console.log('🛠️ Skills section detailed analysis:');
            const skillsContainer = document.querySelector('#skills + div, #skills ~ div');
            if (skillsContainer) {
              console.log(`   - Skills container found`);
              console.log(`   - Text preview: "${skillsContainer.textContent?.substring(0, 150)}..."`);
              console.log(`   - Has .pvs-entity__path-node: ${skillsContainer.querySelectorAll('.pvs-entity__path-node').length}`);
            }
          }

          // Log all pvs-list items
          const allPvsList = document.querySelectorAll('.pvs-list__item--line-separated');
          console.log(`📋 Found ${allPvsList.length} total .pvs-list__item--line-separated elements`);
          
          // Log all path nodes
          const allPathNodes = document.querySelectorAll('.pvs-entity__path-node');
          console.log(`📋 Found ${allPathNodes.length} total .pvs-entity__path-node elements`);
          Array.from(allPathNodes).slice(0, 5).forEach((node, i) => {
            console.log(`   Path node ${i}: "${node.textContent?.trim()}"`);
          });

          return sections;
        }
      }

      window.LinkedInExtractor = FallbackLinkedInExtractor;
      console.log('✅ Fallback LinkedIn extractor created and exposed to global scope');
    }

    // --------------------------------------------------
    // Normalise field-names so the popup UI can render them
    // --------------------------------------------------
    normalizeProfileData(data) {
      console.log('🔄 Normalizing profile data...');

      if (!data) {
        console.log('⚠️ No data to normalize, returning empty structure');
        return this.createEmptyProfileData();
      }

      // Create a normalized copy
      const normalized = { ...data };

      // Ensure both personal_info and personal exist and are populated
      if (normalized.personal_info && !normalized.personal) {
        normalized.personal = { ...normalized.personal_info };
      } else if (normalized.personal && !normalized.personal_info) {
        normalized.personal_info = { ...normalized.personal };
      } else if (!normalized.personal_info && !normalized.personal) {
        normalized.personal_info = {};
        normalized.personal = {};
      }

      // Ensure both experience and work_experience exist
      if (normalized.experience && !normalized.work_experience) {
        normalized.work_experience = [...normalized.experience];
      } else if (normalized.work_experience && !normalized.experience) {
        normalized.experience = [...normalized.work_experience];
      }

      // Ensure all required arrays exist
      if (!normalized.experience) normalized.experience = [];
      if (!normalized.work_experience) normalized.work_experience = [];
      if (!normalized.education) normalized.education = [];
      if (!normalized.skills) normalized.skills = [];
      if (!normalized.projects) normalized.projects = [];
      if (!normalized.languages) normalized.languages = [];
      if (!normalized.certifications) normalized.certifications = [];

      // Ensure summary exists
      if (!normalized.summary) normalized.summary = '';

      // Ensure technical_skills exists if skills are present
      if (normalized.skills.length > 0 && !normalized.technical_skills) {
        normalized.technical_skills = [...normalized.skills];
      }

      console.log('✅ Profile data normalized with structure:', {
        hasPersonalInfo: !!normalized.personal_info && Object.keys(normalized.personal_info).length > 0,
        hasPersonal: !!normalized.personal && Object.keys(normalized.personal).length > 0,
        experienceCount: normalized.experience?.length || 0,
        workExperienceCount: normalized.work_experience?.length || 0,
        educationCount: normalized.education?.length || 0,
        skillsCount: normalized.skills?.length || 0,
        summaryLength: normalized.summary?.length || 0
      });

      return normalized;
    }

    createEmptyProfileData() {
      return {
        personal_info: {},
        personal: {},
        summary: '',
        experience: [],
        work_experience: [],
        education: [],
        skills: [],
        technical_skills: [],
        projects: [],
        languages: [],
        certifications: []
      };
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
