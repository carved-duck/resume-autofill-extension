// Modular Chrome Extension Popup JavaScript
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

    this.initialize();
  }

  async initialize() {
    try {
      // Load existing resume data
      this.resumeData = await this.storageManager.getResumeData();
      if (this.resumeData) {
        this.uiManager.showResumeData(this.resumeData);
      }

      // Setup file handler
      this.fileHandler = new FileHandler(
        this.uiManager.elements.uploadSection,
        this.uiManager.elements.resumeFile,
        (file) => this.handleFileSelected(file)
      );

      // Setup event listeners
      this.setupEventListeners();

      console.log('✅ Popup initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.uiManager.showStatus('Failed to initialize extension', 'error');
    }
  }

  setupEventListeners() {
    // Upload button
    this.uiManager.elements.uploadBtn.addEventListener('click', () => {
      this.handleUpload();
    });

    // Clear data button
    this.uiManager.elements.clearDataBtn.addEventListener('click', () => {
      this.handleClearData();
    });

    // Auto-fill button
    this.uiManager.elements.fillFormBtn.addEventListener('click', () => {
      this.handleAutoFill();
    });

    // Analyze page button
    this.uiManager.elements.analyzePageBtn.addEventListener('click', () => {
      this.handlePageAnalysis();
    });

    // Copy-paste helper button
    this.uiManager.elements.copyPasteHelperBtn.addEventListener('click', () => {
      this.handleCopyPasteHelper();
    });

    // Set up UI manager callbacks
    this.uiManager.setTryClickCallback(() => {
      this.handleTryClick();
    });
  }

  handleFileSelected(file) {
    this.currentFile = file;

    // Validate file
    const errors = this.fileHandler.validateFile(file);
    if (errors.length > 0) {
      this.uiManager.showStatus(errors[0], 'error');
      return;
    }

    // Update UI
    const fileInfo = this.fileHandler.getFileInfo(file);
    this.uiManager.updateUploadButton(fileInfo.name);
    this.uiManager.showStatus(`Selected: ${fileInfo.name} (${fileInfo.sizeFormatted})`, 'info');
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
      this.uiManager.showStatus('Resume parsed successfully! 🎉', 'success');

      // Reset file handler
      this.fileHandler.reset();
      this.uiManager.updateUploadButton(null);

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
      this.uiManager.showStatus('Filling form...', 'info');
      const result = await this.formFiller.fillForm(this.resumeData);
      this.uiManager.showStatus(result.message, 'success');
    } catch (error) {
      this.uiManager.showStatus('Auto-fill failed: ' + error.message, 'error');
    }
  }

  async handlePageAnalysis() {
    try {
      this.uiManager.showStatus('Analyzing page structure...', 'info');
      this.uiManager.hidePageAnalysis();

      const result = await this.formFiller.analyzePageStructure();

      this.uiManager.showPageAnalysis(
        result.analysis,
        result.insights,
        result.editableButtons
      );
      this.uiManager.showStatus('Page analysis complete!', 'success');

    } catch (error) {
      this.uiManager.showStatus('Page analysis failed: ' + error.message, 'error');
    }
  }

  async handleTryClick() {
    try {
      this.uiManager.showStatus('Clicking edit buttons...', 'info');
      const result = await this.formFiller.tryClickEditButtons();
      this.uiManager.showStatus(result.message, 'success');

      // Re-analyze page after clicking
      setTimeout(() => {
        this.handlePageAnalysis();
      }, 1000);

    } catch (error) {
      this.uiManager.showStatus('Click operation failed: ' + error.message, 'error');
    }
  }

  async handleCopyPasteHelper() {
    if (!this.resumeData) {
      this.uiManager.showStatus('No resume data found. Please upload a resume first.', 'warning');
      return;
    }

    try {
      this.uiManager.showCopyPasteHelper(this.resumeData);
      this.uiManager.showStatus('Copy & paste helper ready! Click any section to copy.', 'success');
    } catch (error) {
      this.uiManager.showStatus('Failed to show copy helper: ' + error.message, 'error');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
