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
      // Load existing resume data and metadata
      this.resumeData = await this.storageManager.getResumeData();
      const storageInfo = await this.storageManager.getStorageInfo();
      console.log('[Popup] Loaded resume data from storage:', this.resumeData);
      console.log('[Popup] Storage info:', storageInfo);

      if (this.resumeData && storageInfo && storageInfo.hasData) {
        this.uiManager.showResumeData(this.resumeData);
        this.uiManager.hideNoDataMessage && this.uiManager.hideNoDataMessage();
        this.uiManager.hideDataSourceSelection();
        // Show storage info
        const timeSince = this.getTimeSince(storageInfo.lastUpdated);
        this.uiManager.showStatus(
          `Using stored resume data from ${storageInfo.source} (${timeSince})`,
          'info'
        );
      } else {
        this.uiManager.showNoDataMessage && this.uiManager.showNoDataMessage();
        this.uiManager.showDataSourceSelection();
      }

      // Setup file handler (initially for upload area)
      this.setupFileHandler();

      // Setup event listeners
      this.setupEventListeners();

      // Wire up refresh button
      const refreshBtn = document.getElementById('refreshDataBtn');
      if (refreshBtn) {
        refreshBtn.onclick = async () => {
          console.log('[Popup] Refresh Data button clicked');
          try {
            const data = await this.storageManager.getResumeData();
            console.log('[Popup] Refreshed data from storage:', data);
            if (data) {
              this.uiManager.showResumeData(data);
              this.uiManager.hideNoDataMessage && this.uiManager.hideNoDataMessage();
            } else {
              this.uiManager.showNoDataMessage && this.uiManager.showNoDataMessage();
            }
          } catch (err) {
            this.uiManager.showStatus('Failed to refresh data: ' + err.message, 'error');
            console.error('[Popup] Failed to refresh data:', err);
          }
        };
      }

      // Check content script readiness (don't fail initialization if this fails)
      try {
        await this.checkContentScriptStatus();
      } catch (error) {
        console.warn('⚠️ Content script status check failed:', error.message);
        // Don't show error to user - just log it
      }

      console.log('✅ Enhanced popup initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.uiManager.showStatus('Failed to initialize extension', 'error');
      this.uiManager.showNoDataMessage && this.uiManager.showNoDataMessage();
    }
  }

  // Helper method to check if current tab is on a supported site
  async isOnSupportedSite() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        return false;
      }

      // Check if we're on a chrome:// or chrome-extension:// page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return false;
      }

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

      return supportedSites.some(site => tab.url.includes(site));
    } catch (error) {
      console.error('❌ Failed to check if on supported site:', error);
      return false;
    }
  }

  // Helper method to calculate time since last update
  getTimeSince(timestamp) {
    if (!timestamp || timestamp === 'Never') return 'unknown time';

    try {
      const now = new Date();
      const past = new Date(timestamp);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return 'unknown time';
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

      if (!tab || !tab.url) {
        this.uiManager.showStatus('No active tab found', 'warning');
        return;
      }

      // Check if we're on a chrome:// or chrome-extension:// page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.uiManager.showStatus('Navigate to a job site to enable form filling', 'info');
        return;
      }

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

      const isSupportedSite = supportedSites.some(site => tab.url.includes(site));

      if (!isSupportedSite) {
        this.uiManager.showStatus('Navigate to a supported job site to enable form filling', 'info');
        return;
      }

      // Try to communicate with content script
      try {
        const info = await this.formFiller.getContentScriptInfo();
        if (info.ready) {
          console.log('🔗 Content script ready with features:', info.features);
          this.uiManager.showStatus('Extension ready for intelligent form filling', 'success');
        }
      } catch (error) {
        console.warn('⚠️ Content script not ready:', error.message);

        // Check if we're on a supported site but content script isn't responding
        if (isSupportedSite) {
          this.uiManager.showStatus('Please refresh the page to enable form filling', 'warning');
        } else {
          this.uiManager.showStatus('Navigate to a supported job site to enable form filling', 'info');
        }
      }
    } catch (error) {
      console.error('❌ Failed to check content script status:', error);
      this.uiManager.showStatus('Unable to check extension status', 'error');
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

    // Storage action buttons
    const useStoredDataBtn = document.getElementById('use-stored-data-btn');
    if (useStoredDataBtn) {
      useStoredDataBtn.addEventListener('click', async () => {
        await this.handleUseStoredData();
      });
    }

    const replaceDataBtn = document.getElementById('replace-data-btn');
    if (replaceDataBtn) {
      replaceDataBtn.addEventListener('click', () => {
        this.handleReplaceData();
      });
    }
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

      // Save to storage with source metadata
      await this.storageManager.saveResumeData(parsedData, 'pdf');
      this.resumeData = parsedData;

      // Update UI
      this.uiManager.showResumeData(parsedData);
      this.uiManager.hideDataSourceSelection();
      this.hideStorageInfo();
      this.uiManager.showStatus('Resume parsed and saved successfully! 🎉', 'success');

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
      this.hideStorageInfo();
      this.showDataSourceSelection();
      this.uiManager.showStatus('Resume data cleared successfully!', 'success');
    } catch (error) {
      this.uiManager.showStatus('Failed to clear data: ' + error.message, 'error');
    }
  }

  async handleAutoFill() {
    try {
      // Check if we're on a supported site
      const isSupported = await this.isOnSupportedSite();
      if (!isSupported) {
        this.uiManager.showStatus('Navigate to a supported job site to enable form filling', 'info');
        return;
      }

      this.uiManager.showStatus('Intelligently filling form...', 'info');

      let result;
      if (this.resumeData) {
        // Use in-memory data
        result = await this.formFiller.fillForm(this.resumeData);
      } else {
        // Load from storage and fill
        result = await this.formFiller.fillFormFromStorage();

        // Also load into memory for future use
        this.resumeData = await this.storageManager.getResumeData();
      }

      this.uiManager.showStatus(result.message, 'success');
    } catch (error) {
      console.error('❌ Auto-fill failed:', error);
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
    // Try to load resume data if not available in memory
    if (!this.resumeData) {
      console.log('📂 No resume data in memory, attempting to load from storage...');
      this.resumeData = await this.storageManager.getResumeData();

      if (!this.resumeData) {
        this.uiManager.showStatus('No resume data found. Please upload a resume or extract from LinkedIn first.', 'warning');
        return;
      }
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
    // Try to load resume data if not available in memory
    if (!this.resumeData) {
      console.log('📂 No resume data in memory, attempting to load from storage...');
      this.resumeData = await this.storageManager.getResumeData();

      if (!this.resumeData) {
        this.uiManager.showStatus('No resume data found. Please upload a resume or extract from LinkedIn first.', 'warning');
        return;
      }
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

        // Convert LinkedIn data to the expected format
        const formattedData = {
          personal_info: {
            full_name: linkedInData.personal?.full_name || '',
            first_name: linkedInData.personal?.first_name || '',
            last_name: linkedInData.personal?.last_name || '',
            email: linkedInData.personal?.email || '',
            phone: linkedInData.personal?.phone || '',
            location: linkedInData.personal?.location || '',
            headline: linkedInData.personal?.headline || '',
            linkedin: linkedInData.personal?.linkedin || ''
          },
          summary: linkedInData.summary || '',
          work_experience: linkedInData.experience || [],
          education: linkedInData.education || [],
          skills: linkedInData.skills || [],
          projects: linkedInData.projects || [],
          languages: linkedInData.languages || [],
          certifications: linkedInData.certifications || []
        };

        // Save the formatted data with source metadata
        await this.storageManager.saveResumeData(formattedData, 'linkedin');
        this.resumeData = formattedData;

        // Update UI
        console.log('🎨 Showing resume data in UI:', formattedData);
        this.uiManager.showResumeData(formattedData);
        this.uiManager.hideDataSourceSelection();
        this.hideStorageInfo();
        this.uiManager.showStatus('✅ LinkedIn profile data extracted and saved! 🎉', 'success');

        console.log('✅ LinkedIn data extracted and formatted:', formattedData);
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

  showStorageInfo(storageInfo) {
    const storageInfoDiv = document.getElementById('storage-info');
    const storageSource = document.getElementById('storage-source');
    const storageTime = document.getElementById('storage-time');

    if (storageInfoDiv && storageSource && storageTime) {
      storageSource.textContent = storageInfo.source.charAt(0).toUpperCase() + storageInfo.source.slice(1);
      storageTime.textContent = this.getTimeSince(storageInfo.lastUpdated);
      storageInfoDiv.style.display = 'block';
    }
  }

  hideStorageInfo() {
    const storageInfoDiv = document.getElementById('storage-info');
    if (storageInfoDiv) {
      storageInfoDiv.style.display = 'none';
    }
  }

  async handleUseStoredData() {
    try {
      // Load data from storage
      this.resumeData = await this.storageManager.getResumeData();
      const metadata = await this.storageManager.getResumeMetadata();

      if (this.resumeData) {
        // Hide storage info and show resume data
        this.hideStorageInfo();
        this.uiManager.showResumeData(this.resumeData);
        this.uiManager.hideDataSourceSelection();

        const timeSince = this.getTimeSince(metadata?.timestamp);
        this.uiManager.showStatus(
          `Using stored resume data from ${metadata?.source || 'unknown'} (${timeSince})`,
          'success'
        );
      } else {
        throw new Error('No stored data found');
      }
    } catch (error) {
      this.uiManager.showStatus('Failed to load stored data: ' + error.message, 'error');
    }
  }

  handleReplaceData() {
    // Hide storage info and show data source selection
    this.hideStorageInfo();
    this.showDataSourceSelection();
    this.uiManager.showStatus('Choose a new data source to replace stored data', 'info');
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
