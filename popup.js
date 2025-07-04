// Enhanced Modular Chrome Extension Popup JavaScript
import { ApiClient } from './js/modules/apiClient.js';
import { StorageManager } from './js/modules/storageManager.js';
import { UiManager } from './js/modules/uiManager.js';
import { FormFiller } from './js/modules/formFiller.js';
import { FileHandler } from './js/modules/fileHandler.js';

class PopupController {
  constructor() {
    this.apiClient = new ApiClient();
    this.storageManager = new StorageManager();
    this.uiManager = new UiManager();
    this.formFiller = new FormFiller();

    this.currentFile = null;
    this.resumeData = null;
    this.isMonitoring = false;

    this.initialize();
  }

  async initialize() {
    try {
      // Load existing resume data
      this.resumeData = await this.storageManager.getResumeData();
      if (this.resumeData) {
        this.uiManager.showResumeData(this.resumeData);
        this.uiManager.hideDataSourceSelection();
      } else {
        this.uiManager.showDataSourceSelection();
      }

      // Setup file handler (initially for upload area)
      this.setupFileHandler();

      // Setup event listeners
      this.setupEventListeners();

      // Check content script readiness
      await this.checkContentScriptStatus();

      console.log('✅ Enhanced popup initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.uiManager.showStatus('Failed to initialize extension', 'error');
    }
  }

  setupFileHandler() {
    const uploadArea = document.getElementById('upload-area');
    const resumeFile = document.getElementById('resumeFile');

    if (uploadArea && resumeFile) {
      this.fileHandler = new FileHandler(
        uploadArea,
        resumeFile,
        (file, errors) => this.handleFileSelected(file, errors)
      );

      // Test file handler setup
      this.fileHandler.test();
      console.log('✅ File handler setup complete');
    } else {
      console.warn('⚠️ Upload area or file input not found');
    }
  }

  async checkContentScriptStatus() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.uiManager.showStatus('Navigate to a job site to enable form filling', 'info');
        return;
      }

      const info = await this.formFiller.getContentScriptInfo();
      if (info.ready) {
        console.log('🔗 Content script ready with features:', info.features);
        this.uiManager.showStatus('Extension ready for intelligent form filling', 'success');
      }
    } catch (error) {
      console.warn('⚠️ Content script not ready:', error.message);

      // Try to inject content script if it's not loaded
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && !tab.url.startsWith('chrome://')) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content_main.js']
          });

          // Wait a moment and try again
          setTimeout(async () => {
            try {
              const info = await this.formFiller.getContentScriptInfo();
              if (info.ready) {
                this.uiManager.showStatus('Content script loaded successfully', 'success');
              }
            } catch (retryError) {
              this.uiManager.showStatus('Please refresh the page to enable form filling', 'warning');
            }
          }, 1000);
        }
      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
        this.uiManager.showStatus('Please refresh the page to enable form filling', 'warning');
      }
    }
  }

  setupEventListeners() {
    // Data source selection
    const resumeOption = document.getElementById('resume-option');
    const linkedinOption = document.getElementById('linkedin-option');

    if (resumeOption) {
      resumeOption.addEventListener('click', () => {
        this.showResumeUpload();
      });
    }

    if (linkedinOption) {
      linkedinOption.addEventListener('click', () => {
        this.showLinkedInExtract();
      });
    }

    // Back buttons
    const backToSelection = document.getElementById('back-to-selection');
    const backToSelectionLinkedIn = document.getElementById('back-to-selection-linkedin');

    if (backToSelection) {
      backToSelection.addEventListener('click', () => {
        this.showDataSourceSelection();
      });
    }

    if (backToSelectionLinkedIn) {
      backToSelectionLinkedIn.addEventListener('click', () => {
        this.showDataSourceSelection();
      });
    }

    // Browse button (explicit file selection)
    const browseBtn = document.getElementById('browse-btn');
    if (browseBtn) {
      browseBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('resumeFile');
        if (fileInput) {
          fileInput.click();
        }
      });
    }

    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.handleUpload();
      });
    }

    // LinkedIn extract button
    const linkedinExtractBtn = document.getElementById('linkedinExtractBtn');
    if (linkedinExtractBtn) {
      linkedinExtractBtn.addEventListener('click', () => {
        this.handleLinkedInExtract();
      });
    }

    // Resume data section buttons (if they exist)
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this.handleClearData();
      });
    }

    const fillFormBtn = document.getElementById('fillFormBtn');
    if (fillFormBtn) {
      fillFormBtn.addEventListener('click', () => {
        this.handleAutoFill();
      });
    }

    const analyzePageBtn = document.getElementById('analyzePageBtn');
    if (analyzePageBtn) {
      analyzePageBtn.addEventListener('click', () => {
        this.handleIntelligentPageAnalysis();
      });
    }

    const copyPasteHelperBtn = document.getElementById('copyPasteHelperBtn');
    if (copyPasteHelperBtn) {
      copyPasteHelperBtn.addEventListener('click', () => {
        this.handleCopyPasteHelper();
      });
    }

    // Set up UI manager callbacks for enhanced features
    this.uiManager.setTryIntelligentButtonsCallback(() => {
      return this.handleTryIntelligentButtons();
    });

    // Legacy callback for backward compatibility
    this.uiManager.setTryClickCallback(() => {
      return this.handleTryIntelligentButtons();
    });
  }

  showDataSourceSelection() {
    document.getElementById('data-source-selection').style.display = 'block';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('linkedin-section').style.display = 'none';
    this.uiManager.hideStatus();
  }

  showResumeUpload() {
    document.getElementById('data-source-selection').style.display = 'none';
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('linkedin-section').style.display = 'none';

    // Setup file handler for the upload area
    this.setupFileHandler();
    this.uiManager.showStatus('📄 Select or drag & drop your PDF resume', 'info');
  }

  showLinkedInExtract() {
    document.getElementById('data-source-selection').style.display = 'none';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('linkedin-section').style.display = 'block';
    this.uiManager.showStatus('💼 Follow the steps to extract from LinkedIn', 'info');
  }

    handleFileSelected(file, errors = null) {
    // Handle validation errors from FileHandler
    if (errors && errors.length > 0) {
      this.uiManager.showStatus(errors[0], 'error');
      this.currentFile = null;
      this.hideUploadButton();
      return;
    }

    if (!file) {
      this.uiManager.showStatus('No file selected', 'warning');
      this.currentFile = null;
      this.hideUploadButton();
      return;
    }

    this.currentFile = file;

    // Update UI
    const fileInfo = this.fileHandler.getFileInfo(file);
    this.showUploadButton(fileInfo.name);
    this.uiManager.showStatus(`✅ Selected: ${fileInfo.name} (${fileInfo.sizeFormatted})`, 'success');

    console.log('✅ File selected successfully:', fileInfo);
  }

  showUploadButton(fileName) {
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
      uploadBtn.style.display = 'block';
      uploadBtn.textContent = `📤 Upload "${fileName}"`;
    }
  }

  hideUploadButton() {
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
      uploadBtn.style.display = 'none';
    }
  }

  async handleUpload() {
    if (!this.currentFile) {
      this.uiManager.showStatus('Please select a PDF file first', 'warning');
      return;
    }

    try {
      this.uiManager.showLoading(true);
      this.uiManager.hideStatus();

      // Upload and parse resume
      const parsedData = await this.apiClient.uploadResume(this.currentFile);

      // Save to storage
      await this.storageManager.saveResumeData(parsedData);
      this.resumeData = parsedData;

      // Update UI
      this.uiManager.showResumeData(parsedData);
      this.uiManager.hideDataSourceSelection();
      this.uiManager.showStatus('Resume parsed successfully! 🎉', 'success');

      // Reset file handler
      this.fileHandler.reset();
      this.hideUploadButton();

    } catch (error) {
      this.uiManager.showStatus(error.message, 'error');
    } finally {
      this.uiManager.showLoading(false);
    }
  }

  async handleClearData() {
    try {
      await this.storageManager.clearResumeData();
      this.resumeData = null;
      this.uiManager.hideResumeData();
      this.showDataSourceSelection();
      this.uiManager.showStatus('Resume data cleared successfully!', 'success');
    } catch (error) {
      this.uiManager.showStatus('Failed to clear data: ' + error.message, 'error');
    }
  }

  async handleAutoFill() {
    if (!this.resumeData) {
      this.uiManager.showStatus('No resume data found. Please upload a resume first.', 'warning');
      return;
    }

    try {
      this.uiManager.showStatus('Intelligently filling form...', 'info');
      const result = await this.formFiller.fillForm(this.resumeData);
      this.uiManager.showStatus(result.message, 'success');
    } catch (error) {
      this.uiManager.showStatus('Auto-fill failed: ' + error.message, 'error');
    }
  }

  // Enhanced page analysis with dynamic intelligence
  async handleIntelligentPageAnalysis() {
    try {
      this.uiManager.showStatus('🧠 Starting intelligent page analysis...', 'info');
      this.uiManager.hidePageAnalysis();

      // Show loading state
      this.uiManager.showLoading(true);

      // Perform enhanced analysis
      const result = await this.formFiller.analyzePageStructure();

      // Start monitoring if not already active
      if (!this.isMonitoring) {
        try {
          await this.formFiller.startMonitoring();
          this.isMonitoring = true;
        } catch (monitorError) {
          console.warn('Failed to start monitoring:', monitorError);
        }
      }

      // Display results with enhanced UI
      this.uiManager.showPageAnalysis(
        result.analysis,
        result.recommendations,
        this.isMonitoring
      );

      // Show success message with details
      const stats = result.analysis.staticAnalysis;
      const buttonCount = result.analysis.interactiveElements?.buttons?.length || 0;
      const recCount = result.recommendations?.length || 0;

      let message = `🎉 Analysis complete! Found ${stats.forms.length} forms, ${stats.fields.length} fields, ${buttonCount} buttons`;
      if (recCount > 0) {
        message += `, ${recCount} intelligent recommendations`;
      }

      this.uiManager.showStatus(message, 'success');

    } catch (error) {
      this.uiManager.showStatus('Intelligent analysis failed: ' + error.message, 'error');
    } finally {
      this.uiManager.showLoading(false);
    }
  }

  // Enhanced intelligent button interaction
  async handleTryIntelligentButtons() {
    try {
      this.uiManager.showStatus('🧠 Trying intelligent button interactions...', 'info');

      const result = await this.formFiller.tryIntelligentButtons();

      if (result.success && result.results) {
        const { attempted, successful, newFields } = result.results;

        let message = `🎯 Tried ${attempted} intelligent buttons`;
        if (successful > 0) {
          message += `, ${successful} successful`;
        }
        if (newFields > 0) {
          message += `, revealed ${newFields} new fields!`;
        }

        this.uiManager.showStatus(message, newFields > 0 ? 'success' : 'info');

        // If new fields were revealed, automatically re-analyze
        if (newFields > 0) {
          setTimeout(() => {
            this.handleIntelligentPageAnalysis();
          }, 1500);
        }
      } else {
        this.uiManager.showStatus(result.message || 'No high-value buttons found', 'info');
      }

    } catch (error) {
      this.uiManager.showStatus('Intelligent button interaction failed: ' + error.message, 'error');
    }
  }

  async handleCopyPasteHelper() {
    if (!this.resumeData) {
      this.uiManager.showStatus('No resume data found. Please upload a resume first.', 'warning');
      return;
    }

    try {
      this.uiManager.showCopyPasteHelper(this.resumeData);
      this.uiManager.showStatus('📋 Copy & paste helper ready! Click any section to copy.', 'success');
    } catch (error) {
      this.uiManager.showStatus('Failed to show copy helper: ' + error.message, 'error');
    }
  }

  // Monitor page changes and provide smart notifications
  async startSmartMonitoring() {
    if (this.isMonitoring) return;

    try {
      await this.formFiller.startMonitoring();
      this.isMonitoring = true;
      this.uiManager.showStatus('📡 Smart monitoring activated', 'success');
    } catch (error) {
      this.uiManager.showStatus('Failed to start monitoring: ' + error.message, 'error');
    }
  }

  async stopSmartMonitoring() {
    if (!this.isMonitoring) return;

    try {
      await this.formFiller.stopMonitoring();
      this.isMonitoring = false;
      this.uiManager.showStatus('Monitoring stopped', 'info');
    } catch (error) {
      this.uiManager.showStatus('Failed to stop monitoring: ' + error.message, 'error');
    }
  }

  // Get current analysis for debugging
  getCurrentAnalysis() {
    return this.formFiller.getCurrentAnalysis();
  }

  // Check if analysis is in progress
  isAnalyzing() {
    return this.formFiller.isAnalysisInProgress();
  }

  // Quick action for immediate form filling after analysis
  async quickFillAfterAnalysis() {
    if (!this.resumeData) {
      this.uiManager.showStatus('No resume data available', 'warning');
      return;
    }

    try {
      // First try intelligent buttons to reveal fields
      await this.handleTryIntelligentButtons();

      // Wait a moment for DOM updates
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then fill the form
      await this.handleAutoFill();

    } catch (error) {
      this.uiManager.showStatus('Quick fill failed: ' + error.message, 'error');
    }
  }

  async handleLinkedInExtract() {
    try {
      this.uiManager.showStatus('🔍 Checking for LinkedIn page...', 'info');

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
        this.uiManager.showStatus('Please navigate to your LinkedIn profile page first', 'warning');
        return;
      }

      this.uiManager.showLoading(true);
      this.uiManager.showStatus('💼 Extracting data from LinkedIn profile...', 'info');

      // Inject and execute LinkedIn extractor
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          // Import and use LinkedInExtractor
          const { LinkedInExtractor } = await import(chrome.runtime.getURL('js/modules/linkedinExtractor.js'));
          const extractor = new LinkedInExtractor();
          return await extractor.extractProfileData();
        }
      });

      if (results && results[0] && results[0].result) {
        const linkedInData = results[0].result;

        // Save the extracted data
        await this.storageManager.saveResumeData(linkedInData);
        this.resumeData = linkedInData;

        // Update UI
        this.uiManager.showResumeData(linkedInData);
        this.uiManager.hideDataSourceSelection();
        this.uiManager.showStatus('✅ LinkedIn profile data extracted successfully! 🎉', 'success');

        console.log('✅ LinkedIn data extracted:', linkedInData);
      } else {
        throw new Error('No data extracted from LinkedIn');
      }

    } catch (error) {
      console.error('❌ LinkedIn extraction failed:', error);
      this.uiManager.showStatus(`Failed to extract LinkedIn data: ${error.message}`, 'error');
    } finally {
      this.uiManager.showLoading(false);
    }
  }
}

// Initialize popup controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupController());
} else {
  new PopupController();
}
