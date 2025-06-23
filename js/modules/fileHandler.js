// File Handler module for drag-and-drop and file operations
export class FileHandler {
  constructor(uploadSection, fileInput, onFileSelected) {
    this.uploadSection = uploadSection;
    this.fileInput = fileInput;
    this.onFileSelected = onFileSelected;
    this.setupDragAndDrop();
    this.setupFileInput();
  }

  setupDragAndDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, () => this.highlight(), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.uploadSection.addEventListener(eventName, () => this.unhighlight(), false);
    });

    // Handle dropped files
    this.uploadSection.addEventListener('drop', (e) => this.handleDrop(e), false);

    // Handle click to open file dialog
    this.uploadSection.addEventListener('click', () => {
      this.fileInput.click();
    });
  }

  setupFileInput() {
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        this.onFileSelected(file);
      }
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlight() {
    this.uploadSection.classList.add('highlight');
  }

  unhighlight() {
    this.uploadSection.classList.remove('highlight');
  }

  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];
      this.onFileSelected(file);
    }
  }

  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file selected');
      return errors;
    }

    if (file.type !== 'application/pdf') {
      errors.push('Please select a PDF file');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      errors.push('File size must be less than 10MB');
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
    this.fileInput.value = '';
    this.unhighlight();
  }
}
