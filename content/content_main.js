// Enhanced Content Script - Main Orchestrator
// Clean, modular version that coordinates all functionality

console.log('🚀 Resume Auto-Fill Extension - Content Script Loaded (Modular Version)');

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
          'NotificationManager'
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
          sendResponse({ success: true, message: 'Content script is active' });
          break;

        default:
          // Let other modules handle their specific messages
          return false;
      }

      return true; // Indicate async response
    });
  }

  async handleFillForm(message, sendResponse) {
    try {
      console.log('📝 Handling form fill request...');

      if (!this.formFiller) {
        throw new Error('Form filler not initialized');
      }

      // Validate the page first
      const pageValidation = window.DataValidator?.validatePageForFilling();
      if (pageValidation && !pageValidation.hasInputs) {
        throw new Error('No fillable fields found on this page');
      }

      // Validate resume data
      const dataValidation = window.DataValidator?.validateResumeData(message.data);
      if (dataValidation && !dataValidation.isValid) {
        throw new Error(`Invalid resume data: ${dataValidation.errors.join(', ')}`);
      }

      // Store the data
      this.resumeData = message.data;

      // Fill the form
      const result = this.formFiller.fillFormWithResumeData(message.data);

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
        const extractedData = await window.LinkedInExtractor.extractProfile();

        window.NotificationManager?.showNotification(
          'LinkedIn profile data extracted successfully!',
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
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('js/modules/linkedinExtractor.js');
      script.onload = () => {
        console.log('📦 LinkedIn extractor loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load LinkedIn extractor');
        reject(new Error('Failed to load LinkedIn extractor'));
      };
      document.head.appendChild(script);
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
