// Chrome Extension Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const uploadBtn = document.getElementById('uploadBtn');
  const resumeFile = document.getElementById('resumeFile');
  const fillFormBtn = document.getElementById('fillFormBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const uploadSection = document.getElementById('upload-section');
  const loading = document.getElementById('loading');
  const resumeDataDiv = document.getElementById('resume-data');
  const status = document.getElementById('status');
  const dataPreview = document.getElementById('data-preview');

  // Configuration - Update this to your backend URL
  const API_CONFIG = {
    // For development (enhanced backend)
    development: 'http://localhost:3001',
    // For production (update when you deploy)
    production: 'https://your-app.herokuapp.com'
  };

  // Automatically detect environment
  const API_BASE_URL = API_CONFIG.development; // Change to production when ready

  // Initialize: Load existing resume data
  chrome.storage.local.get(['resumeData'], function(result) {
    if (result.resumeData) {
      showResumeData(result.resumeData);
    }
  });

  // Event Listeners
  setupEventListeners();

  function setupEventListeners() {
    // Upload button click
    uploadBtn.addEventListener('click', handleUpload);

    // Upload section click to trigger file dialog
    uploadSection.addEventListener('click', function() {
      resumeFile.click();
    });

    // File input change
    resumeFile.addEventListener('change', function() {
      if (this.files.length > 0) {
        uploadBtn.textContent = `📤 Upload "${this.files[0].name}"`;
        uploadBtn.style.background = '#007bff';
      }
    });

    // Clear data button
    clearDataBtn.addEventListener('click', function() {
      chrome.storage.local.remove(['resumeData'], function() {
        hideResumeData();
        showStatus('Resume data cleared successfully!', 'success');
      });
    });

    // Auto-fill button
    fillFormBtn.addEventListener('click', handleAutoFill);

    // Drag and drop functionality
    setupDragAndDrop();
  }

  function handleUpload() {
    const file = resumeFile.files[0];

    if (!file) {
      showStatus('Please select a PDF file first', 'warning');
      return;
    }

    if (file.type !== 'application/pdf') {
      showStatus('Please select a PDF file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showStatus('File size must be less than 10MB', 'error');
      return;
    }

    uploadResume(file);
  }

  function uploadResume(file) {
    showLoading(true);
    hideStatus();

    const formData = new FormData();
    formData.append('resume_file', file);

    // Make API call to your Rails backend
    fetch(`${API_BASE_URL}/resume/parse_api`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      showLoading(false);

      if (data.success && data.data) {
        // Store the parsed data in Chrome storage
        chrome.storage.local.set({ resumeData: data.data }, function() {
          showResumeData(data.data);
          showStatus('Resume parsed successfully! 🎉', 'success');
        });
      } else {
        throw new Error(data.error || 'Failed to parse resume');
      }
    })
    .catch(error => {
      showLoading(false);
      console.error('Upload error:', error);

      let errorMessage = 'Failed to parse resume. ';
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Please make sure your backend server is running.';
      } else {
        errorMessage += error.message;
      }

      showStatus(errorMessage, 'error');
    });
  }

  function handleAutoFill() {
    chrome.storage.local.get(['resumeData'], function(result) {
      if (!result.resumeData) {
        showStatus('No resume data found. Please upload a resume first.', 'warning');
        return;
      }

      // Get current active tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];

        // Check if we're on a supported site
        if (!isSupportedSite(currentTab.url)) {
          showStatus('This site is not yet supported for auto-fill', 'warning');
          return;
        }

        // Send message to content script
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'fillForm',
          data: result.resumeData
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Content script error:', chrome.runtime.lastError);
            showStatus('Unable to fill form. Please refresh the page and try again.', 'error');
          } else if (response && response.success) {
            const fieldsCount = response.fieldsCount || 0;
            showStatus(`Successfully filled ${fieldsCount} fields! ✨`, 'success');
          } else {
            showStatus('No form fields found to fill on this page', 'warning');
          }
        });
      });
    });
  }

  function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadSection.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadSection.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadSection.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
      uploadSection.classList.add('drag-over');
    }

    function unhighlight(e) {
      uploadSection.classList.remove('drag-over');
    }

    uploadSection.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          resumeFile.files = files;
          uploadResume(file);
        } else {
          showStatus('Please drop a PDF file', 'error');
        }
      }
    }
  }

  function showResumeData(data) {
    // Create summary of parsed data
    let summary = '';

    if (data.personal?.full_name) {
      summary += `<div class="data-item">
        <span class="data-label">👤 Name:</span>
        <span class="data-value">${data.personal.full_name}</span>
      </div>`;
    }

    if (data.personal?.email) {
      summary += `<div class="data-item">
        <span class="data-label">📧 Email:</span>
        <span class="data-value">${data.personal.email}</span>
      </div>`;
    }

    if (data.education?.length > 0) {
      summary += `<div class="data-item">
        <span class="data-label">🎓 Education:</span>
        <span class="data-value">${data.education.length} entries</span>
      </div>`;
    }

    if (data.experience?.length > 0) {
      summary += `<div class="data-item">
        <span class="data-label">💼 Experience:</span>
        <span class="data-value">${data.experience.length} jobs</span>
      </div>`;
    }

    if (data.skills?.length > 0) {
      summary += `<div class="data-item">
        <span class="data-label">🛠️ Skills:</span>
        <span class="data-value">${data.skills.length} skills</span>
      </div>`;
    }

    dataPreview.innerHTML = summary || '<div class="data-item">No data extracted</div>';

    uploadSection.style.display = 'none';
    resumeDataDiv.style.display = 'block';
  }

  function hideResumeData() {
    uploadSection.style.display = 'block';
    resumeDataDiv.style.display = 'none';
    resumeFile.value = '';
    uploadBtn.textContent = '📤 Upload & Parse Resume';
    uploadBtn.style.background = '';
  }

  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    uploadBtn.disabled = show;

    if (show) {
      uploadBtn.textContent = '⏳ Processing...';
    }
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    // Auto-hide after 4 seconds
    setTimeout(() => {
      hideStatus();
    }, 4000);
  }

  function hideStatus() {
    status.style.display = 'none';
  }

  function isSupportedSite(url) {
    const supportedDomains = [
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

    return supportedDomains.some(domain => url.includes(domain));
  }
});
