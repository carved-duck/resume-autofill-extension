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
    
    // Test hybrid button
    const testHybridBtn = document.getElementById('testHybridBtn');
    if (testHybridBtn) {
      testHybridBtn.addEventListener('click', () => this.testHybridExtraction());
    }
    
    // LinkedIn debug functionality removed - use comparison test instead

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

    // Show extracted data button
    const showDataBtn = document.getElementById('showDataBtn');
    if (showDataBtn) {
      showDataBtn.addEventListener('click', () => this.showExtractedData());
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

  async checkContentScriptReady(tabId, maxRetries = 3) {
    console.log('🔍 Checking if content script is ready...');
    
    let lastError = null;
    let lastResponse = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          action: 'ping'
        });
        
        lastResponse = response;
        
        if (response && response.success && response.ready) {
          console.log('✅ Content script is ready:', response);
          return { ready: true, response };
        } else if (response && response.success && !response.ready) {
          console.log('⚠️ Content script loaded but not ready:', response);
          return { ready: false, response, error: response.error || 'Not initialized' };
        }
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Content script ping attempt ${i + 1} failed:`, error.message);
        
        if (i < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    console.log('❌ Content script not ready after all retries');
    return { 
      ready: false, 
      error: lastError?.message || 'Connection failed',
      response: lastResponse,
      attempts: maxRetries
    };
  }

  showContentScriptError(status) {
    let message = 'Content script error: ';
    let instructions = '';

    if (status.error === 'Could not establish connection. Receiving end does not exist.') {
      message = 'Extension not loaded on this page.';
      instructions = 'Please refresh the page and try again.';
    } else if (status.response && !status.response.ready) {
      message = 'Extension is loading but not ready.';
      instructions = 'Please wait a moment and try again.';
      if (status.response.error) {
        message += ` Error: ${status.response.error}`;
      }
    } else if (status.error === 'Connection failed') {
      message = 'Cannot connect to extension on this page.';
      instructions = 'Please refresh the page and ensure the extension is enabled.';
    } else {
      message += status.error;
      instructions = 'Please refresh the page and try again.';
    }

    this.showMessage(`${message} ${instructions}`, 'error');
    console.log('❌ Content script error details:', status);
  }

  async extractLinkedInData() {
    try {
      this.showMessage('Checking content script status...', 'info');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('linkedin.com')) {
        this.showMessage('Please navigate to a LinkedIn profile page', 'error');
        return;
      }

      // Check if content script is ready
      const readyStatus = await this.checkContentScriptReady(tab.id);
      if (!readyStatus.ready) {
        this.showContentScriptError(readyStatus);
        return;
      }

      this.showMessage('Extracting LinkedIn profile data...', 'info');

      // Check if hybrid mode is enabled (with null safety)
      const hybridModeToggle = document.getElementById('hybridModeToggle');
      const useHybridMode = hybridModeToggle?.checked || false;

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractLinkedIn',
        useHybridMode: useHybridMode
      }).catch(error => {
        console.error('❌ Failed to send message to content script:', error);
        throw new Error('Could not communicate with content script. Try refreshing the page.');
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
        console.log('🔍 Popup received data:', JSON.stringify(response.data, null, 2));

        // Enhanced data structure logging
        console.log('📊 Popup data analysis:', {
          hasPersonalInfo: !!response.data.personal_info,
          hasPersonal: !!response.data.personal,
          personalInfoKeys: Object.keys(response.data.personal_info || {}),
          personalKeys: Object.keys(response.data.personal || {}),
          hasWorkExperience: !!response.data.work_experience,
          workExperienceCount: response.data.work_experience?.length || 0,
          hasEducation: !!response.data.education,
          educationCount: response.data.education?.length || 0,
          hasSkills: !!response.data.skills,
          skillsCount: response.data.skills?.length || 0,
          hasSummary: !!response.data.summary,
          summaryLength: response.data.summary?.length || 0
        });

        // Ensure data compatibility
        if (response.data.personal_info && !response.data.personal) {
          response.data.personal = response.data.personal_info;
          console.log('🔄 Added personal field for UI compatibility');
        }
        if (response.data.work_experience && !response.data.experience) {
          response.data.experience = response.data.work_experience;
          console.log('🔄 Added experience field for UI compatibility');
        }

        await this.storageManager.saveResumeData(response.data, 'linkedin');
        this.resumeData = response.data;
        
        console.log('🎨 Calling uiManager.showResumeData with:', {
          dataKeys: Object.keys(response.data),
          personalInfoExists: !!response.data.personal_info,
          personalExists: !!response.data.personal
        });
        
        this.uiManager.showResumeData(response.data);
        this.showMessage('LinkedIn profile data extracted successfully!', 'success');
      } else {
        const errorMsg = response?.error || 'Failed to extract LinkedIn data';
        console.error('❌ LinkedIn extraction failed:', errorMsg);
        this.showLinkedInExtractionError(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error during LinkedIn extraction:', error);
      this.showLinkedInExtractionError(error.message);
    }
  }

  async testHybridExtraction() {
    try {
      this.showMessage('Testing hybrid vs traditional extraction...', 'info');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('linkedin.com')) {
        this.showMessage('Please navigate to a LinkedIn profile page', 'error');
        return;
      }

      // Check if content script is ready
      const readyStatus = await this.checkContentScriptReady(tab.id);
      if (!readyStatus.ready) {
        this.showContentScriptError(readyStatus);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'testHybridExtraction'
      }).catch(error => {
        console.error('❌ Failed to send test message to content script:', error);
        throw new Error('Could not communicate with content script. Try refreshing the page.');
      });

      if (response && response.success) {
        this.showMessage('✅ Hybrid test completed! Check console for detailed comparison.', 'success');
        console.log('🧪 Extraction Comparison Results:', response);
      } else {
        throw new Error(response?.error || 'Test failed');
      }

    } catch (error) {
      console.error('❌ Hybrid test failed:', error);
      this.showMessage(`Hybrid test failed: ${error.message}`, 'error');
    }
  }

  // Debug functionality removed - use hybrid comparison test instead

  showLinkedInExtractionError(errorMessage) {
    let message = 'LinkedIn extraction failed: ';
    let instructions = '';

    if (errorMessage.includes('Could not establish connection')) {
      message = 'Cannot connect to LinkedIn page.';
      instructions = 'Please refresh the page and try again.';
    } else if (errorMessage.includes('Not on LinkedIn page')) {
      message = 'Please navigate to your LinkedIn profile page.';
      instructions = 'Go to linkedin.com/in/your-profile and try again.';
    } else if (errorMessage.includes('not fully initialized')) {
      message = 'Extension is still loading.';
      instructions = 'Please wait a moment and try again.';
    } else {
      message += errorMessage;
      instructions = 'Please refresh the page and ensure you are on your LinkedIn profile.';
    }

    this.showMessage(`${message} ${instructions}`, 'error');
  }

  async showExtractedData() {
    try {
      console.log('🔍 Showing extracted data modal...');
      
      // Get the latest resume data
      const data = await this.storageManager.getLatestResumeData();
      
      if (!data) {
        this.showMessage('No extracted data found. Please extract data first.', 'error');
        return;
      }

      console.log('📊 Showing extracted data:', data);
      
      // Show the data in a modal or detailed view
      this.uiManager.showDetailedDataModal(data);
      
    } catch (error) {
      console.error('❌ Error showing extracted data:', error);
      this.showMessage('Error displaying extracted data: ' + error.message, 'error');
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
