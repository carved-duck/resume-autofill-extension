// Enhanced File Handler module for drag-and-drop and file operations
export class FileHandler {
  constructor(uploadSection = null, fileInput = null, onFileSelected = null) {
    this.uploadSection = uploadSection;
    this.fileInput = fileInput;
    this.onFileSelected = onFileSelected;
    this.isFileDialogOpen = false;

    // Bind methods to preserve 'this' context
    this.preventDefaults = this.preventDefaults.bind(this);
    this.highlight = this.highlight.bind(this);
    this.unhighlight = this.unhighlight.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleFileInput = this.handleFileInput.bind(this);
    this.handleUploadClick = this.handleUploadClick.bind(this);

    // Only set up if elements are provided
    if (uploadSection && fileInput) {
      this.setupDragAndDrop();
      this.setupFileInput();
      this.setupClickHandler();
      console.log('📁 FileHandler initialized with full functionality');
    } else {
      console.log('📁 FileHandler initialized in minimal mode (missing DOM elements)');
    }
  }

  setupDragAndDrop() {
    if (!this.uploadSection) {
      console.log('ℹ️ Upload section not found - skipping drag and drop setup');
      return;
    }

    console.log('✅ Setting up drag and drop on upload section');

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
  }

  setupFileInput() {
    if (!this.fileInput) {
      console.log('ℹ️ File input not found - skipping file input setup');
      return;
    }

    console.log('✅ Setting up file input handler');
    this.fileInput.addEventListener('change', (e) => this.handleFileInput(e), false);
  }

  setupClickHandler() {
    if (!this.uploadSection) {
      console.log('ℹ️ Upload section not found - skipping click handler setup');
      return;
    }

    console.log('✅ Setting up click handlers');
    this.uploadSection.addEventListener('click', (e) => this.handleUploadClick(e), false);
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlight(e) {
    if (this.uploadSection) {
      this.uploadSection.classList.add('highlight');
    }
  }

  unhighlight(e) {
    if (this.uploadSection) {
      this.uploadSection.classList.remove('highlight');
    }
  }

  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      this.handleFiles(files);
    }
  }

  handleFileInput(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.handleFiles(files);
    }
  }

  handleUploadClick(e) {
    if (this.fileInput && !this.isFileDialogOpen) {
      this.isFileDialogOpen = true;
      this.fileInput.click();

      // Reset flag after a delay
      setTimeout(() => {
        this.isFileDialogOpen = false;
      }, 1000);
    }
  }

  handleFiles(files) {
    const file = files[0];
    if (file && this.onFileSelected) {
      this.onFileSelected(file);
    }
  }

  // Add method for external file processing
  async processFile(file) {
    console.log('📄 Processing file:', file.name);

    // This would typically send the file to your backend
    // For now, return a mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          personal_info: {
            name: 'Mock User',
            email: 'mock@example.com'
          },
          experience: [],
          education: [],
          skills: []
        });
      }, 1000);
    });
  }
}
