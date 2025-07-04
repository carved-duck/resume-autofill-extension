// Enhanced File Handler module for drag-and-drop and file operations
export class FileHandler {
  constructor(uploadSection, fileInput, onFileSelected) {
    this.uploadSection = uploadSection;
    this.fileInput = fileInput;
    this.onFileSelected = onFileSelected;

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
      this.uploadSection.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, this.highlight, false);
    });

    // Remove highlight when drag leaves or file is dropped
    ['dragleave', 'drop'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, this.unhighlight, false);
    });

    // Handle dropped files
    this.uploadSection.addEventListener('drop', this.handleDrop, false);

    console.log('🎯 Drag and drop events set up');
  }

  setupFileInput() {
    if (!this.fileInput) {
      console.error('❌ File input not found');
      return;
    }

    this.fileInput.addEventListener('change', this.handleFileInput, false);
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
    this.uploadSection.addEventListener('click', this.handleUploadClick, false);

    // Also handle direct clicks on the upload section text
    const uploadText = this.uploadSection.querySelector('.upload-text');
    if (uploadText) {
      uploadText.addEventListener('click', this.handleUploadClick, false);
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
    if (e.target.tagName === 'BUTTON') {
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

    if (this.fileInput) {
      // Force trigger the file input click
      try {
        // Make sure the file input is properly configured
        this.fileInput.type = 'file';
        this.fileInput.accept = '.pdf';
        this.fileInput.style.display = 'none';

        // Trigger the click
        this.fileInput.click();
        console.log('✅ File dialog triggered successfully');
      } catch (error) {
        console.error('❌ Failed to trigger file dialog:', error);

        // Fallback: create a new file input
        try {
          const newInput = document.createElement('input');
          newInput.type = 'file';
          newInput.accept = '.pdf';
          newInput.style.display = 'none';
          newInput.addEventListener('change', this.handleFileInput);
          document.body.appendChild(newInput);
          newInput.click();
          document.body.removeChild(newInput);
          console.log('✅ Fallback file dialog triggered');
        } catch (fallbackError) {
          console.error('❌ Fallback file dialog also failed:', fallbackError);
        }
      }
    } else {
      console.error('❌ File input not available for click');
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
