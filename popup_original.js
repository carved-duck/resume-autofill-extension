// Chrome Extension Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const uploadBtn = document.getElementById('uploadBtn');
  const resumeFile = document.getElementById('resumeFile');
  const fillFormBtn = document.getElementById('fillFormBtn');
  const analyzePageBtn = document.getElementById('analyzePageBtn');
  const copyPasteHelperBtn = document.getElementById('copyPasteHelperBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const uploadSection = document.getElementById('upload-section');
  const loading = document.getElementById('loading');
  const resumeDataDiv = document.getElementById('resume-data');
  const status = document.getElementById('status');
  const dataPreview = document.getElementById('data-preview');
  const pageAnalysisDiv = document.getElementById('page-analysis');
  const copyPasteHelperDiv = document.getElementById('copy-paste-helper');

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

    // Analyze page button
    analyzePageBtn.addEventListener('click', handlePageAnalysis);

    // Copy-paste helper button
    copyPasteHelperBtn.addEventListener('click', handleCopyPasteHelper);

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

                // Send fill form message to content script
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'fillForm',
          data: result.resumeData
        }, function(response) {
          if (!response) {
            showStatus('Could not communicate with page. Make sure you\'re on a supported site.', 'error');
            return;
          }

          if (response.success) {
            const message = `Successfully filled ${response.fieldsCount} fields!`;
            showStatus(message, 'success');
          } else {
            showStatus('Auto-fill failed: ' + (response.error || 'Unknown error'), 'error');
          }
        });
      });
    });
  }

  function handlePageAnalysis() {
    // Get current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];

      showStatus('Analyzing page structure...', 'info');
      hidePageAnalysis();

      // Send analyze message to content script
      chrome.tabs.sendMessage(currentTab.id, { action: 'analyzePageStructure' }, function(response) {
        if (!response) {
          showStatus('Could not analyze page. Make sure content script is loaded.', 'error');
          return;
        }

        if (response.success) {
          showPageAnalysis(response.analysis, response.insights, response.editableButtons);
          showStatus('Page analysis complete!', 'success');
        } else {
          showStatus('Page analysis failed: ' + (response.error || 'Unknown error'), 'error');
        }
      });
    });
  }

  function handleTryClick() {
    // Get current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];

      showStatus('Attempting to click edit buttons...', 'info');

      // Send try click message to content script
      chrome.tabs.sendMessage(currentTab.id, { action: 'tryClickToReveal' }, function(response) {
        if (!response) {
          showStatus('Could not try clicking. Make sure content script is loaded.', 'error');
          return;
        }

        if (response.success) {
          showStatus(response.message, 'success');
          // Automatically re-analyze after clicking to see if new fields appeared
          setTimeout(() => {
            handlePageAnalysis();
          }, 1000);
        } else {
          showStatus('Failed to try clicking: ' + (response.error || 'Unknown error'), 'error');
        }
      });
    });
  }

  function handleCopyPasteHelper() {
    chrome.storage.local.get(['resumeData'], function(result) {
      if (!result.resumeData) {
        showStatus('No resume data found. Please upload a resume first.', 'warning');
        return;
      }

      showCopyPasteHelper(result.resumeData);
      hidePageAnalysis(); // Hide page analysis if showing
      showStatus('Copy-paste helper ready! Click any section to copy.', 'success');
    });
  }

  function sendAutoFillMessage(tabId, resumeData) {
    // This function is no longer needed as we handle auto-fill directly in handleAutoFill
    console.log('sendAutoFillMessage called (deprecated)');
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

  function showPageAnalysis(analysis, insights, editableButtons = []) {
    if (!pageAnalysisDiv) return;

    let html = '<h3>🔍 Page Analysis Results</h3>';

    // Show insights
    if (insights && insights.length > 0) {
      html += '<div class="insights-section">';
      html += '<h4>📊 Page Insights:</h4>';
      html += '<ul>';
      insights.forEach(insight => {
        html += `<li>${insight}</li>`;
      });
      html += '</ul>';
      html += '</div>';
    }

    // Show detailed element counts
    html += '<div class="elements-section">';
    html += '<h4>📋 Elements Found:</h4>';
    html += '<div class="element-grid">';
    html += `<div class="element-item">📝 Inputs: <strong>${analysis.inputs.length}</strong></div>`;
    html += `<div class="element-item">📑 Textareas: <strong>${analysis.textareas.length}</strong></div>`;
    html += `<div class="element-item">✏️ Rich Text: <strong>${analysis.contentEditables.length}</strong></div>`;
    html += `<div class="element-item">🔗 Buttons: <strong>${analysis.buttons.length}</strong></div>`;
    html += `<div class="element-item">📋 Sections: <strong>${analysis.sections.length}</strong></div>`;
    html += `<div class="element-item">📄 Forms: <strong>${analysis.forms.length}</strong></div>`;
    html += '</div>';
    html += '</div>';

    // Show some example fields found
    if (analysis.inputs.length > 0) {
      html += '<div class="fields-section">';
      html += '<h4>📝 Sample Input Fields:</h4>';
      html += '<ul class="field-list">';
      analysis.inputs.slice(0, 5).forEach(input => {
        const label = input.placeholder || input.name || input.id || `${input.type} field`;
        html += `<li><code>${input.type}</code> - ${label}</li>`;
      });
      if (analysis.inputs.length > 5) {
        html += `<li><em>... and ${analysis.inputs.length - 5} more</em></li>`;
      }
      html += '</ul>';
      html += '</div>';
    }

    // Show editable buttons that we can try clicking
    if (editableButtons && editableButtons.length > 0) {
      html += '<div class="editable-buttons-section">';
      html += '<h4>🎯 Clickable Edit Buttons Found:</h4>';
      html += '<ul class="button-list">';
      editableButtons.slice(0, 5).forEach(button => {
        const label = button.text || button.value || button.id || 'Unlabeled button';
        html += `<li>"${label}" <em>(${button.reason})</em></li>`;
      });
      if (editableButtons.length > 5) {
        html += `<li><em>... and ${editableButtons.length - 5} more</em></li>`;
      }
      html += '</ul>';

      // Add button to try clicking
      html += '<button id="tryClickBtn" style="background: #ffc107; border-color: #ffc107; color: #000; margin: 10px 0; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">🖱️ Try Clicking These Buttons</button>';
      html += '</div>';
    }

    // Show buttons that might be useful
    if (analysis.buttons.length > 0) {
      html += '<div class="buttons-section">';
      html += '<h4>🔗 All Available Actions:</h4>';
      html += '<ul class="button-list">';
      analysis.buttons.slice(0, 5).forEach(button => {
        const label = button.text || button.value || button.id || 'Unlabeled button';
        html += `<li>"${label}"</li>`;
      });
      if (analysis.buttons.length > 5) {
        html += `<li><em>... and ${analysis.buttons.length - 5} more</em></li>`;
      }
      html += '</ul>';
      html += '</div>';
    }

    pageAnalysisDiv.innerHTML = html;
    pageAnalysisDiv.style.display = 'block';

    // Add event listener for the try click button
    const tryClickBtn = document.getElementById('tryClickBtn');
    if (tryClickBtn) {
      tryClickBtn.addEventListener('click', handleTryClick);
    }
  }

  function hidePageAnalysis() {
    if (pageAnalysisDiv) {
      pageAnalysisDiv.style.display = 'none';
    }
  }

  function showCopyPasteHelper(data) {
    if (!copyPasteHelperDiv) return;

    let html = '<h3>📋 Copy-Paste Helper</h3>';
    html += '<p style="font-size: 11px; opacity: 0.8; margin: 0 0 15px 0;">Click any section below to copy it to your clipboard!</p>';

    // Personal Information
    if (data.personal) {
      if (data.personal.full_name) {
        html += createCopySection('👤 Full Name', data.personal.full_name);
      }
      if (data.personal.first_name) {
        html += createCopySection('📝 First Name', data.personal.first_name);
      }
      if (data.personal.last_name) {
        html += createCopySection('📝 Last Name', data.personal.last_name);
      }
      if (data.personal.email) {
        html += createCopySection('📧 Email', data.personal.email);
      }
      if (data.personal.phone) {
        html += createCopySection('📞 Phone', data.personal.phone);
      }
      if (data.personal.address) {
        html += createCopySection('🏠 Address', data.personal.address);
      }
      if (data.personal.linkedin) {
        html += createCopySection('💼 LinkedIn', data.personal.linkedin);
      }
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      const skillsText = data.skills.join(', ');
      html += createCopySection('🛠️ Skills (Comma-separated)', skillsText);

      const skillsBullets = data.skills.map(skill => `• ${skill}`).join('\n');
      html += createCopySection('🛠️ Skills (Bullet points)', skillsBullets);
    }

    // Work Experience
    if (data.experience && data.experience.length > 0) {
      // Most recent job for quick access
      const recentJob = data.experience[0];
      if (recentJob.title) {
        html += createCopySection('💼 Current Job Title', recentJob.title);
      }
      if (recentJob.company) {
        html += createCopySection('🏢 Current Company', recentJob.company);
      }

      // Full experience list
      data.experience.forEach((job, index) => {
        const jobText = formatExperience(job);
        html += createCopySection(`💼 Job ${index + 1}: ${job.company || 'Company'}`, jobText);
      });
    }

    // Education
    if (data.education && data.education.length > 0) {
      // Most recent education
      const recentEdu = data.education[0];
      if (recentEdu.school) {
        html += createCopySection('🎓 School/University', recentEdu.school);
      }
      if (recentEdu.degree) {
        html += createCopySection('📜 Degree', recentEdu.degree);
      }

      // Full education list
      data.education.forEach((edu, index) => {
        const eduText = formatEducation(edu);
        html += createCopySection(`🎓 Education ${index + 1}`, eduText);
      });
    }

    // Summary/Cover Letter (Auto-generated)
    const summary = generateSummaryForCopy(data);
    html += createCopySection('📄 Auto-Generated Summary', summary);

    copyPasteHelperDiv.innerHTML = html;
    copyPasteHelperDiv.style.display = 'block';

    // Add copy functionality to all copy buttons
    addCopyEventListeners();
  }

  function createCopySection(title, content) {
    const sectionId = 'copy-' + title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `
      <div class="copy-section">
        <h4>
          ${title}
          <button class="copy-btn" data-copy-target="${sectionId}">📋 Copy</button>
        </h4>
        <div class="copy-content" id="${sectionId}" tabindex="0">${content}</div>
      </div>
    `;
  }

  function formatExperience(job) {
    let text = '';
    if (job.title) text += `Position: ${job.title}\n`;
    if (job.company) text += `Company: ${job.company}\n`;
    if (job.dates) text += `Duration: ${job.dates}\n`;
    if (job.location) text += `Location: ${job.location}\n`;
    if (job.description) text += `\nDescription:\n${job.description}`;
    return text.trim();
  }

  function formatEducation(edu) {
    let text = '';
    if (edu.degree) text += `Degree: ${edu.degree}\n`;
    if (edu.school) text += `Institution: ${edu.school}\n`;
    if (edu.dates) text += `Duration: ${edu.dates}\n`;
    if (edu.location) text += `Location: ${edu.location}\n`;
    if (edu.gpa) text += `GPA: ${edu.gpa}`;
    return text.trim();
  }

  function generateSummaryForCopy(data) {
    // Generate both English and Japanese versions
    let summary = '=== ENGLISH VERSION ===\n\n';

    if (data.personal?.full_name) {
      summary += `I am ${data.personal.full_name}, `;
    } else {
      summary += 'I am ';
    }

    if (data.experience && data.experience.length > 0) {
      const recentJob = data.experience[0];
      if (recentJob.title && recentJob.company) {
        summary += `currently working as ${recentJob.title} at ${recentJob.company}. `;
      }
    }

    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 5).join(', ');
      summary += `My key skills include ${topSkills}. `;
    }

    summary += 'I am excited about this opportunity and believe my experience makes me a strong candidate.\n\n';

    // Add Japanese version
    summary += '=== JAPANESE VERSION ===\n\n';

    if (data.personal?.full_name) {
      summary += `私は${data.personal.full_name}と申します。`;
    } else {
      summary += 'この度は貴重な機会をいただき、ありがとうございます。';
    }

    if (data.experience && data.experience.length > 0) {
      const recentJob = data.experience[0];
      if (recentJob.title && recentJob.company) {
        summary += `現在、${recentJob.company}で${recentJob.title}として勤務しております。`;
      }
    }

    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 5).join('、');
      summary += `私のスキルには${topSkills}などがございます。`;
    }

    summary += 'よろしくお願いいたします。';

    return summary;
  }

  function addCopyEventListeners() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        const targetId = this.getAttribute('data-copy-target');
        const contentElement = document.getElementById(targetId);

        if (contentElement) {
          try {
            await navigator.clipboard.writeText(contentElement.textContent);

            // Visual feedback
            this.textContent = '✅ Copied!';
            this.classList.add('copied');

            // Reset after 2 seconds
            setTimeout(() => {
              this.textContent = '📋 Copy';
              this.classList.remove('copied');
            }, 2000);

          } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback: select the text
            const range = document.createRange();
            range.selectNodeContents(contentElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            this.textContent = '📝 Selected';
          }
        }
      });
    });
  }

  function hideCopyPasteHelper() {
    if (copyPasteHelperDiv) {
      copyPasteHelperDiv.style.display = 'none';
    }
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
