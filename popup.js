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

    this.currentFile = null;
    this.resumeData = null;
    this.isInitialized = false;
    this.fileHandler = null; // Add this

    this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('🔧 Initializing popup controller...');

    try {
      // Set up event listeners
      this.setupEventListeners();

      // Load any existing resume data
      await this.loadExistingData();

      this.isInitialized = true;
      console.log('✅ Popup controller initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.showMessage('Failed to initialize extension', 'error');
    }
  }

  setupEventListeners() {
    // Initialize FileHandler with proper DOM elements after DOM is ready
    const uploadSection = document.getElementById('upload-section');
    const fileInput = document.getElementById('resumeFile');

    if (uploadSection && fileInput) {
      this.fileHandler = new FileHandler(uploadSection, fileInput, (file) => {
        // Handle file selection
        this.handleFileUpload({ target: { files: [file] } });
      });
      console.log('✅ FileHandler initialized with DOM elements');
    } else {
      console.log('ℹ️ Upload elements not found - file upload will be handled by buttons');
    }

    // LinkedIn extraction button
    const linkedinBtn = document.getElementById('linkedinExtractBtn');
    if (linkedinBtn) {
      linkedinBtn.addEventListener('click', () => this.extractLinkedInData());
    }

    // File upload button - manual fallback
    const uploadBtn = document.getElementById('uploadBtn');
    const resumeFile = document.getElementById('resumeFile');

    if (uploadBtn && resumeFile) {
      uploadBtn.addEventListener('click', () => resumeFile.click());
      resumeFile.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Browse button in upload area
    const browseBtn = document.getElementById('browse-btn');
    if (browseBtn && resumeFile) {
      browseBtn.addEventListener('click', () => resumeFile.click());
    }

    // Form fill button
    const fillFormBtn = document.getElementById('fillFormBtn');
    if (fillFormBtn) {
      fillFormBtn.addEventListener('click', () => this.fillCurrentForm());
    }

    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => this.clearAllData());
    }

    // Page analysis button
    const analyzePageBtn = document.getElementById('analyzePageBtn');
    if (analyzePageBtn) {
      analyzePageBtn.addEventListener('click', () => this.analyzeCurrentPage());
    }

    // Back buttons for navigation
    const backToSelection = document.getElementById('back-to-selection');
    const backToSelectionLinkedin = document.getElementById('back-to-selection-linkedin');

    if (backToSelection) {
      backToSelection.addEventListener('click', () => this.showDataSourceSelection());
    }

    if (backToSelectionLinkedin) {
      backToSelectionLinkedin.addEventListener('click', () => this.showDataSourceSelection());
    }

    // Data source option buttons
    const resumeOption = document.getElementById('resume-option');
    const linkedinOption = document.getElementById('linkedin-option');

    if (resumeOption) {
      resumeOption.addEventListener('click', () => this.showUploadSection());
    }

    if (linkedinOption) {
      linkedinOption.addEventListener('click', () => this.showLinkedInSection());
    }
  }

  async loadExistingData() {
    try {
      const data = await this.storageManager.getLatestResumeData();
      if (data) {
        this.resumeData = data;
        this.uiManager.showResumeData(data);
        console.log('📂 Loaded existing resume data');
      } else {
        this.uiManager.showNoDataMessage();
      }
    } catch (error) {
      console.warn('⚠️ Could not load existing data:', error);
      this.uiManager.showNoDataMessage();
    }
  }

  async extractLinkedInData() {
    try {
      this.showMessage('Extracting LinkedIn profile data...', 'info');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('linkedin.com')) {
        this.showMessage('Please navigate to a LinkedIn profile page', 'error');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractLinkedIn'
      });

      console.log('🎯 Full response from content script:', response);
      console.log('📊 Response data structure:', {
        hasData: !!response?.data,
        success: response?.success,
        dataKeys: Object.keys(response?.data || {}),
        personalInfo: response?.data?.personal_info,
        personalInfoAlt: response?.data?.personal,
        experienceCount: response?.data?.work_experience?.length || 0
      });

      if (response && response.success && response.data) {
        console.log('✅ LinkedIn data extracted successfully');

        // Ensure data compatibility
        if (response.data.personal_info && !response.data.personal) {
          response.data.personal = response.data.personal_info;
        }
        if (response.data.work_experience && !response.data.experience) {
          response.data.experience = response.data.work_experience;
        }

        await this.storageManager.saveResumeData(response.data, 'linkedin');
        this.resumeData = response.data;
        this.uiManager.showResumeData(response.data);
        this.showMessage('LinkedIn profile data extracted successfully!', 'success');
      } else {
        const errorMsg = response?.error || 'Failed to extract LinkedIn data';
        console.error('❌ LinkedIn extraction failed:', errorMsg);
        this.showMessage(errorMsg, 'error');
      }
    } catch (error) {
      console.error('❌ Error during LinkedIn extraction:', error);
      this.showMessage('Error extracting LinkedIn data: ' + error.message, 'error');
    }
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.showMessage('Processing file...', 'info');

    try {
      const resumeData = await this.fileHandler.processFile(file);

      if (resumeData) {
        await this.storageManager.saveResumeData(resumeData, 'upload');
        this.resumeData = resumeData;
        this.uiManager.showResumeData(resumeData);
        this.uiManager.updateUploadButton(file.name);
        this.showMessage('Resume uploaded and processed successfully!', 'success');
      } else {
        this.showMessage('Failed to extract data from file', 'error');
      }
    } catch (error) {
      console.error('❌ File processing error:', error);
      this.showMessage('Error processing file: ' + error.message, 'error');
    }
  }

  async fillCurrentForm() {
    try {
      if (!this.resumeData) {
        // Try to load from storage
        this.resumeData = await this.storageManager.getLatestResumeData();
      }

      if (!this.resumeData) {
        this.showMessage('No resume data available. Please extract from LinkedIn or upload a file first.', 'error');
        return;
      }

      this.showMessage('Filling form...', 'info');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        data: this.resumeData
      });

      if (response && response.success) {
        this.showMessage(`Form filled successfully! ${response.result.fieldsCount} fields filled.`, 'success');
      } else {
        this.showMessage(response?.error || 'Failed to fill form', 'error');
      }
    } catch (error) {
      console.error('❌ Form filling error:', error);
      this.showMessage('Error filling form: ' + error.message, 'error');
    }
  }

  async analyzeCurrentPage() {
    try {
      this.showMessage('Analyzing page...', 'info');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'analyzePageStructure'
      });

      if (response && response.success) {
        this.uiManager.showPageAnalysis(response.analysis, response.recommendations);
        this.showMessage('Page analyzed successfully!', 'success');
      } else {
        this.showMessage(response?.error || 'Failed to analyze page', 'error');
      }
    } catch (error) {
      console.error('❌ Page analysis error:', error);
      this.showMessage('Error analyzing page: ' + error.message, 'error');
    }
  }

  async clearAllData() {
    try {
      await this.storageManager.clearAllData();
      this.resumeData = null;
      this.uiManager.hideResumeData();
      this.uiManager.showNoDataMessage();
      this.uiManager.updateUploadButton(null);
      this.showMessage('All data cleared successfully!', 'success');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      this.showMessage('Error clearing data: ' + error.message, 'error');
    }
  }

  showMessage(message, type = 'info') {
    this.uiManager.showStatus(message, type);
  }

  showDataSourceSelection() {
    document.getElementById('data-source-selection').style.display = 'block';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('linkedin-section').style.display = 'none';
  }

  showUploadSection() {
    document.getElementById('data-source-selection').style.display = 'none';
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('linkedin-section').style.display = 'none';
  }

  showLinkedInSection() {
    document.getElementById('data-source-selection').style.display = 'none';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('linkedin-section').style.display = 'block';
  }
}

// Initialize popup controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎬 DOM loaded, initializing popup controller...');
  new PopupController();
});
