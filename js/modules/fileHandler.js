// Enhanced File Handler module for drag-and-drop and file operations
export class FileHandler {
  constructor(uploadSection, fileInput, onFileSelected) {
    this.uploadSection = uploadSection;
    this.fileInput = fileInput;
    this.onFileSelected = onFileSelected;
    this.isFileDialogOpen = false; // Add flag to prevent multiple dialogs

    // Bind methods to preserve 'this' context
    this.preventDefaults = this.preventDefaults.bind(this);
    this.highlight = this.highlight.bind(this);
    this.unhighlight = this.unhighlight.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleFileInput = this.handleFileInput.bind(this);
    this.handleUploadClick = this.handleUploadClick.bind(this);

    this.setupDragAndDrop();
    this.setupFileInput();
    this.setupClickHandler();

    console.log('📁 FileHandler initialized');
  }

  setupDragAndDrop() {
    if (!this.uploadSection) {
      console.error('❌ Upload section not found');
      return;
    }

    // Prevent default drag behaviors on the upload section and document
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, (e) => this.preventDefaults(e), false);
      document.body.addEventListener(eventName, (e) => this.preventDefaults(e), false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, (e) => this.highlight(e), false);
    });

    // Remove highlight when drag leaves or file is dropped
    ['dragleave', 'drop'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, (e) => this.unhighlight(e), false);
    });

    // Handle dropped files
    this.uploadSection.addEventListener('drop', (e) => this.handleDrop(e), false);

    console.log('🎯 Drag and drop events set up');
  }

  setupFileInput() {
    if (!this.fileInput) {
      console.error('❌ File input not found');
      return;
    }

    console.log('🔍 Setting up file input:', this.fileInput);
    console.log('🔍 File input type before:', this.fileInput.type);
    console.log('🔍 File input accept before:', this.fileInput.accept);

    // Make sure the file input is properly configured
    this.fileInput.type = 'file';
    this.fileInput.accept = '.pdf';
    this.fileInput.style.display = 'none';

    console.log('🔍 File input type after:', this.fileInput.type);
    console.log('🔍 File input accept after:', this.fileInput.accept);

    this.fileInput.addEventListener('change', (e) => {
      console.log('🎯 File input change event fired!');
      this.handleFileInput(e);
    }, false);
    console.log('📎 File input change event set up');
  }

  setupClickHandler() {
    if (!this.uploadSection) {
      console.error('❌ Upload section not found for click handler');
      return;
    }

    if (!this.fileInput) {
      console.error('❌ File input not found for click handler');
      return;
    }

    // Handle click on upload section to open file dialog
    this.uploadSection.addEventListener('click', (e) => this.handleUploadClick(e), false);

    // Also handle direct clicks on the upload section text
    const uploadText = this.uploadSection.querySelector('.upload-text');
    if (uploadText) {
      uploadText.addEventListener('click', (e) => this.handleUploadClick(e), false);
    }

    console.log('👆 Upload section click handler set up');
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlight() {
    this.uploadSection.classList.add('highlight');
    console.log('✨ Upload area highlighted');
  }

  unhighlight() {
    this.uploadSection.classList.remove('highlight');
    console.log('🔄 Upload area unhighlighted');
  }

  handleDrop(e) {
    console.log('📥 File dropped');

    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];
      console.log('📄 Processing dropped file:', file.name);
      this.processFile(file);
    } else {
      console.warn('⚠️ No files found in drop event');
    }
  }

  handleFileInput(e) {
    console.log('📁 File input changed');

    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('📄 Processing selected file:', file.name);
      this.processFile(file);
    } else {
      console.warn('⚠️ No files selected');
    }
  }

      handleUploadClick(e) {
    // Don't trigger file dialog if clicking on the upload button itself
    // But allow the browse button to work
    if (e.target.tagName === 'BUTTON' && e.target.id !== 'browse-btn') {
      console.log('🔘 Upload button clicked, not triggering file dialog');
      return;
    }

    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();

    console.log('👆 Upload section clicked, opening file dialog');
    console.log('🔍 File input element:', this.fileInput);
    console.log('🔍 File input type:', this.fileInput?.type);
    console.log('🔍 File input accept:', this.fileInput?.accept);

    // Prevent multiple file dialogs from opening
    if (this.isFileDialogOpen) {
      console.log('⚠️ File dialog already open, ignoring click');
      return;
    }

    // Create a new temporary file input for each click
    try {
      console.log('🎯 Creating temporary file input...');
      this.isFileDialogOpen = true; // Set flag

      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.accept = '.pdf';
      tempInput.style.display = 'none';

      // Add change event listener
      tempInput.addEventListener('change', (e) => {
        console.log('🎯 Temporary file input change event fired!');
        this.isFileDialogOpen = false; // Reset flag
        this.handleFileInput(e);
        // Clean up
        document.body.removeChild(tempInput);
      });

      // Add to DOM and trigger click
      document.body.appendChild(tempInput);
      tempInput.click();
      console.log('✅ Temporary file dialog triggered successfully');

    } catch (error) {
      console.error('❌ Failed to create temporary file input:', error);
      this.isFileDialogOpen = false; // Reset flag on error
    }
  }

  processFile(file) {
    if (!file) {
      console.error('❌ No file provided to process');
      return;
    }

    console.log('🔍 Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file before calling callback
    const errors = this.validateFile(file);
    if (errors.length > 0) {
      console.error('❌ File validation failed:', errors);
      // Still call the callback so the UI can show the error
      this.onFileSelected(null, errors);
      return;
    }

    console.log('✅ File validation passed');
    this.onFileSelected(file);
  }

  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file selected');
      return errors;
    }

    console.log('🔍 Validating file:', file.name, 'Type:', file.type);

    // Check file type
    if (file.type !== 'application/pdf') {
      errors.push('Please select a PDF file. Selected file type: ' + (file.type || 'unknown'));
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`File size must be less than 10MB. Current size: ${this.formatFileSize(file.size)}`);
    }

    // Check if file has content
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }

    if (errors.length > 0) {
      console.warn('⚠️ File validation errors:', errors);
    } else {
      console.log('✅ File validation successful');
    }

    return errors;
  }

  getFileInfo(file) {
    if (!file) return null;

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      sizeFormatted: this.formatFileSize(file.size)
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  reset() {
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    this.unhighlight();
    console.log('🔄 FileHandler reset');
  }

  // Test method to verify functionality
  test() {
    console.log('🧪 Testing FileHandler:');
    console.log('- Upload section:', !!this.uploadSection);
    console.log('- File input:', !!this.fileInput);
    console.log('- Callback:', typeof this.onFileSelected);

    if (this.uploadSection) {
      console.log('- Upload section classes:', this.uploadSection.className);
      console.log('- Upload section ID:', this.uploadSection.id);
    }

    if (this.fileInput) {
      console.log('- File input type:', this.fileInput.type);
      console.log('- File input accept:', this.fileInput.accept);
    }
  }
}
