// UI Manager module for DOM manipulation and status updates
export class UiManager {
  constructor() {
    this.elements = this.initializeElements();
  }

  initializeElements() {
    return {
      uploadBtn: document.getElementById('uploadBtn'),
      resumeFile: document.getElementById('resumeFile'),
      fillFormBtn: document.getElementById('fillFormBtn'),
      analyzePageBtn: document.getElementById('analyzePageBtn'),
      copyPasteHelperBtn: document.getElementById('copyPasteHelperBtn'),
      clearDataBtn: document.getElementById('clearDataBtn'),
      uploadSection: document.getElementById('upload-section'),
      loading: document.getElementById('loading'),
      resumeDataDiv: document.getElementById('resume-data'),
      status: document.getElementById('status'),
      dataPreview: document.getElementById('data-preview'),
      pageAnalysisDiv: document.getElementById('page-analysis'),
      copyPasteHelperDiv: document.getElementById('copy-paste-helper')
    };
  }

  showLoading(show) {
    this.elements.loading.style.display = show ? 'block' : 'none';
    this.elements.uploadBtn.disabled = show;
  }

  showStatus(message, type = 'info') {
    const statusEl = this.elements.status;
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => this.hideStatus(), 3000);
    }
  }

  hideStatus() {
    this.elements.status.style.display = 'none';
  }

  updateUploadButton(fileName) {
    if (fileName) {
      this.elements.uploadBtn.textContent = `📤 Upload "${fileName}"`;
      this.elements.uploadBtn.style.background = '#007bff';
    } else {
      this.elements.uploadBtn.textContent = '📤 Upload Resume';
      this.elements.uploadBtn.style.background = '';
    }
  }

  showResumeData(data) {
    const resumeDataDiv = this.elements.resumeDataDiv;
    const dataPreview = this.elements.dataPreview;

    // Show resume data section
    resumeDataDiv.style.display = 'block';

    // Generate preview HTML
    let previewHtml = '<div class="data-section">';

    // Personal Information
    if (data.personal) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>👤 Personal Information</h4>';
      previewHtml += '<div class="data-items">';

      if (data.personal.full_name) {
        previewHtml += `<div class="data-item"><strong>Name:</strong> ${data.personal.full_name}</div>`;
      }
      if (data.personal.email) {
        previewHtml += `<div class="data-item"><strong>Email:</strong> ${data.personal.email}</div>`;
      }
      if (data.personal.phone) {
        previewHtml += `<div class="data-item"><strong>Phone:</strong> ${data.personal.phone}</div>`;
      }
      if (data.personal.address) {
        previewHtml += `<div class="data-item"><strong>Address:</strong> ${data.personal.address}</div>`;
      }

      previewHtml += '</div></div>';
    }

    // Experience
    if (data.experience && data.experience.length > 0) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>💼 Work Experience</h4>';
      previewHtml += '<div class="data-items">';

      data.experience.slice(0, 3).forEach((job, index) => {
        previewHtml += `<div class="data-item">`;
        previewHtml += `<strong>${job.title || 'Position'}</strong>`;
        if (job.company) previewHtml += ` at ${job.company}`;
        if (job.dates) previewHtml += ` (${job.dates})`;
        previewHtml += `</div>`;
      });

      if (data.experience.length > 3) {
        previewHtml += `<div class="data-item"><em>... and ${data.experience.length - 3} more</em></div>`;
      }

      previewHtml += '</div></div>';
    }

    // Education
    if (data.education && data.education.length > 0) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>🎓 Education</h4>';
      previewHtml += '<div class="data-items">';

      data.education.forEach((edu, index) => {
        previewHtml += `<div class="data-item">`;
        if (edu.degree) previewHtml += `<strong>${edu.degree}</strong> `;
        if (edu.school) previewHtml += `at ${edu.school}`;
        if (edu.year) previewHtml += ` (${edu.year})`;
        previewHtml += `</div>`;
      });

      previewHtml += '</div></div>';
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>🛠️ Skills</h4>';
      previewHtml += '<div class="data-items">';
      previewHtml += `<div class="data-item">${data.skills.slice(0, 10).join(', ')}`;
      if (data.skills.length > 10) {
        previewHtml += ` <em>(+${data.skills.length - 10} more)</em>`;
      }
      previewHtml += `</div>`;
      previewHtml += '</div></div>';
    }

    previewHtml += '</div>';
    dataPreview.innerHTML = previewHtml;
  }

  hideResumeData() {
    this.elements.resumeDataDiv.style.display = 'none';
    this.elements.dataPreview.innerHTML = '';
  }

  showPageAnalysis(analysis, insights, editableButtons = []) {
    const pageAnalysisDiv = this.elements.pageAnalysisDiv;
    pageAnalysisDiv.style.display = 'block';

    let analysisHtml = '<div class="analysis-section">';
    analysisHtml += '<h4>📊 Page Analysis Results</h4>';

    // Basic info
    analysisHtml += '<div class="analysis-group">';
    analysisHtml += '<h5>Page Information</h5>';
    analysisHtml += `<div class="analysis-item"><strong>URL:</strong> ${analysis.url}</div>`;
    analysisHtml += `<div class="analysis-item"><strong>Title:</strong> ${analysis.title}</div>`;
    analysisHtml += `<div class="analysis-item"><strong>Page Type:</strong> ${analysis.pageType}</div>`;
    analysisHtml += `<div class="analysis-item"><strong>Strategy:</strong> ${analysis.recommendedStrategy}</div>`;
    analysisHtml += '</div>';

    // Form elements
    analysisHtml += '<div class="analysis-group">';
    analysisHtml += '<h5>Form Elements Found</h5>';
    analysisHtml += `<div class="analysis-item">📝 Forms: ${analysis.forms.length}</div>`;
    analysisHtml += `<div class="analysis-item">📥 Input Fields: ${analysis.inputs.length}</div>`;
    analysisHtml += `<div class="analysis-item">📄 Text Areas: ${analysis.textareas.length}</div>`;
    analysisHtml += `<div class="analysis-item">✏️ Editable Content: ${analysis.contentEditables.length}</div>`;
    analysisHtml += `<div class="analysis-item">🔘 Buttons: ${analysis.buttons.length}</div>`;
    analysisHtml += '</div>';

    // Insights
    if (insights && insights.length > 0) {
      analysisHtml += '<div class="analysis-group">';
      analysisHtml += '<h5>💡 Insights</h5>';
      insights.forEach(insight => {
        analysisHtml += `<div class="analysis-item">${insight}</div>`;
      });
      analysisHtml += '</div>';
    }

    // Editable buttons
    if (editableButtons && editableButtons.length > 0) {
      analysisHtml += '<div class="analysis-group">';
      analysisHtml += '<h5>🖱️ Clickable Elements</h5>';
      analysisHtml += '<div class="button-actions">';
      analysisHtml += '<button id="try-click-btn" class="action-btn">🖱️ Try Clicking Edit Buttons</button>';
      analysisHtml += '</div>';
      analysisHtml += '<div class="editable-buttons">';
      editableButtons.forEach((btn, index) => {
        analysisHtml += `<div class="analysis-item">• ${btn.text || btn.type || 'Button'} (${btn.reason})</div>`;
      });
      analysisHtml += '</div>';
      analysisHtml += '</div>';
    }

    analysisHtml += '</div>';
    pageAnalysisDiv.innerHTML = analysisHtml;

    // Add click handler for try-click button
    const tryClickBtn = document.getElementById('try-click-btn');
    if (tryClickBtn) {
      tryClickBtn.addEventListener('click', () => {
        this.onTryClick && this.onTryClick();
      });
    }
  }

  hidePageAnalysis() {
    this.elements.pageAnalysisDiv.style.display = 'none';
    this.elements.pageAnalysisDiv.innerHTML = '';
  }

  showCopyPasteHelper(data) {
    const helperDiv = this.elements.copyPasteHelperDiv;
    helperDiv.style.display = 'block';

    let helperHtml = '<div class="copy-paste-section">';
    helperHtml += '<h4>📋 Copy & Paste Helper</h4>';
    helperHtml += '<p>Click any section below to copy to clipboard:</p>';

    // Personal Info
    if (data.personal) {
      if (data.personal.full_name) {
        helperHtml += this.createCopySection('Full Name', data.personal.full_name);
      }
      if (data.personal.email) {
        helperHtml += this.createCopySection('Email', data.personal.email);
      }
      if (data.personal.phone) {
        helperHtml += this.createCopySection('Phone', data.personal.phone);
      }
      if (data.personal.address) {
        helperHtml += this.createCopySection('Address', data.personal.address);
      }
    }

    // Experience
    if (data.experience && data.experience.length > 0) {
      data.experience.forEach((job, index) => {
        const title = `Work Experience ${index + 1}`;
        const content = this.formatExperience(job);
        helperHtml += this.createCopySection(title, content);
      });
    }

    // Education
    if (data.education && data.education.length > 0) {
      data.education.forEach((edu, index) => {
        const title = `Education ${index + 1}`;
        const content = this.formatEducation(edu);
        helperHtml += this.createCopySection(title, content);
      });
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      helperHtml += this.createCopySection('Skills', data.skills.join(', '));
    }

    // Summary
    const summary = this.generateSummaryForCopy(data);
    helperHtml += this.createCopySection('Professional Summary', summary);

    helperHtml += '</div>';
    helperDiv.innerHTML = helperHtml;

    // Add copy event listeners
    this.addCopyEventListeners();
  }

  hideCopyPasteHelper() {
    this.elements.copyPasteHelperDiv.style.display = 'none';
    this.elements.copyPasteHelperDiv.innerHTML = '';
  }

  createCopySection(title, content) {
    return `
      <div class="copy-section" data-copy="${content}">
        <div class="copy-header">
          <span class="copy-title">${title}</span>
          <span class="copy-icon">📋</span>
        </div>
        <div class="copy-content">${content}</div>
      </div>
    `;
  }

  formatExperience(job) {
    let formatted = '';
    if (job.title) formatted += job.title;
    if (job.company) formatted += ` at ${job.company}`;
    if (job.dates) formatted += ` (${job.dates})`;
    if (job.description) formatted += `\n${job.description}`;
    return formatted;
  }

  formatEducation(edu) {
    let formatted = '';
    if (edu.degree) formatted += edu.degree;
    if (edu.school) formatted += ` from ${edu.school}`;
    if (edu.year) formatted += ` (${edu.year})`;
    return formatted;
  }

  generateSummaryForCopy(data) {
    let summary = '';

    if (data.personal && data.personal.full_name) {
      summary += `I am ${data.personal.full_name}, `;
    } else {
      summary += 'I am ';
    }

    if (data.experience && data.experience.length > 0) {
      const currentJob = data.experience[0];
      if (currentJob.title) {
        summary += `a ${currentJob.title}`;
        if (currentJob.company) {
          summary += ` at ${currentJob.company}`;
        }
      } else {
        summary += 'a professional';
      }
    } else {
      summary += 'a dedicated professional';
    }

    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 5).join(', ');
      summary += ` with expertise in ${topSkills}`;
    }

    summary += '. I am passionate about delivering high-quality work and contributing to team success.';

    if (data.experience && data.experience.length > 0) {
      summary += ` With my experience in ${data.experience[0].title || 'my field'}, I bring valuable skills and insights to any organization.`;
    }

    return summary;
  }

  addCopyEventListeners() {
    const copySections = document.querySelectorAll('.copy-section');
    copySections.forEach(section => {
      section.addEventListener('click', () => {
        const content = section.getAttribute('data-copy');
        navigator.clipboard.writeText(content).then(() => {
          const icon = section.querySelector('.copy-icon');
          const originalIcon = icon.textContent;
          icon.textContent = '✅';
          setTimeout(() => {
            icon.textContent = originalIcon;
          }, 1000);
        });
      });
    });
  }

  // Callback setters for event handling
  setTryClickCallback(callback) {
    this.onTryClick = callback;
  }
}
