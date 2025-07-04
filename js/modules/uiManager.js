// Enhanced UI Manager module for Dynamic Page Intelligence
export class UiManager {
  constructor() {
    this.elements = this.initializeElements();
    this.tryClickCallback = null;
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

    // Also disable other action buttons during loading
    if (this.elements.fillFormBtn) this.elements.fillFormBtn.disabled = show;
    if (this.elements.analyzePageBtn) this.elements.analyzePageBtn.disabled = show;
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
      if (data.personal.linkedin) {
        previewHtml += `<div class="data-item"><strong>LinkedIn:</strong> <a href="${data.personal.linkedin}" target="_blank" style="color: #fff; text-decoration: underline;">Profile</a></div>`;
      }
      if (data.personal.website) {
        previewHtml += `<div class="data-item"><strong>Website:</strong> <a href="${data.personal.website}" target="_blank" style="color: #fff; text-decoration: underline;">Portfolio</a></div>`;
      }

      previewHtml += '</div></div>';
    }

    // Professional Summary
    if (data.summary) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>📝 Professional Summary</h4>';
      previewHtml += '<div class="data-items">';
      previewHtml += `<div class="data-item summary-text">${data.summary}</div>`;
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

    // Technical Skills
    if (data.technical_skills && data.technical_skills.length > 0) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>💻 Technical Skills</h4>';
      previewHtml += '<div class="data-items">';
      previewHtml += `<div class="data-item">${data.technical_skills.slice(0, 10).join(', ')}`;
      if (data.technical_skills.length > 10) {
        previewHtml += ` <em>(+${data.technical_skills.length - 10} more)</em>`;
      }
      previewHtml += `</div>`;
      previewHtml += '</div></div>';
    }

    // General Skills
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

    // Projects
    if (data.projects && data.projects.length > 0) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>🚀 Projects</h4>';
      previewHtml += '<div class="data-items">';
      data.projects.slice(0, 3).forEach((project, index) => {
        previewHtml += `<div class="data-item">`;
        previewHtml += `<strong>${project.name || `Project ${index + 1}`}</strong>`;
        if (project.description) {
          previewHtml += `<br><small>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</small>`;
        }
        previewHtml += `</div>`;
      });
      if (data.projects.length > 3) {
        previewHtml += `<div class="data-item"><em>... and ${data.projects.length - 3} more</em></div>`;
      }
      previewHtml += '</div></div>';
    }

    // Languages
    if (data.languages && data.languages.length > 0) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>🌐 Languages</h4>';
      previewHtml += '<div class="data-items">';
      data.languages.forEach((lang) => {
        previewHtml += `<div class="data-item">`;
        previewHtml += `<strong>${lang.language || lang}</strong>`;
        if (lang.proficiency) {
          previewHtml += ` (${lang.proficiency})`;
        }
        previewHtml += `</div>`;
      });
      previewHtml += '</div></div>';
    }

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      previewHtml += '<div class="data-group">';
      previewHtml += '<h4>🏆 Certifications</h4>';
      previewHtml += '<div class="data-items">';
      data.certifications.slice(0, 3).forEach((cert) => {
        previewHtml += `<div class="data-item">`;
        previewHtml += `<strong>${cert.name || cert}</strong>`;
        if (cert.year) {
          previewHtml += ` (${cert.year})`;
        }
        previewHtml += `</div>`;
      });
      if (data.certifications.length > 3) {
        previewHtml += `<div class="data-item"><em>... and ${data.certifications.length - 3} more</em></div>`;
      }
      previewHtml += '</div></div>';
    }

    previewHtml += '</div>';
    dataPreview.innerHTML = previewHtml;
  }

  hideResumeData() {
    this.elements.resumeDataDiv.style.display = 'none';
    this.elements.dataPreview.innerHTML = '';
  }

  // Enhanced page analysis display with intelligent recommendations
  showPageAnalysis(analysis, recommendations = [], monitoring = false) {
    const pageAnalysisDiv = this.elements.pageAnalysisDiv;
    pageAnalysisDiv.style.display = 'block';

    let analysisHtml = '<div class="enhanced-analysis-section">';

    // Header with monitoring status
    analysisHtml += '<div class="analysis-header">';
    analysisHtml += '<h4>🧠 Dynamic Page Intelligence</h4>';
    if (monitoring) {
      analysisHtml += '<div class="monitoring-status">📡 Live monitoring active</div>';
    }
    analysisHtml += '</div>';

    // Quick stats overview
    if (analysis.staticAnalysis) {
      analysisHtml += '<div class="stats-overview">';
      analysisHtml += '<div class="stat-card">';
      analysisHtml += `<div class="stat-number">${analysis.staticAnalysis.forms.length}</div>`;
      analysisHtml += '<div class="stat-label">Forms</div>';
      analysisHtml += '</div>';

      analysisHtml += '<div class="stat-card">';
      analysisHtml += `<div class="stat-number">${analysis.staticAnalysis.fields.length}</div>`;
      analysisHtml += '<div class="stat-label">Fields</div>';
      analysisHtml += '</div>';

      analysisHtml += '<div class="stat-card">';
      analysisHtml += `<div class="stat-number">${analysis.interactiveElements?.buttons?.length || 0}</div>`;
      analysisHtml += '<div class="stat-label">Buttons</div>';
      analysisHtml += '</div>';

      analysisHtml += '<div class="stat-card">';
      analysisHtml += `<div class="stat-number">${Math.round((analysis.staticAnalysis.pageStructure?.complexity?.score || 0) / 10)}</div>`;
      analysisHtml += '<div class="stat-label">Complexity</div>';
      analysisHtml += '</div>';
      analysisHtml += '</div>';
    }

    // Intelligent Recommendations (Priority Display)
    if (recommendations && recommendations.length > 0) {
      analysisHtml += '<div class="recommendations-section">';
      analysisHtml += '<h5>💡 Intelligent Recommendations</h5>';

      recommendations.forEach((rec, index) => {
        const priorityClass = rec.priority === 'high' ? 'high-priority' :
                             rec.priority === 'medium' ? 'medium-priority' : 'low-priority';

        analysisHtml += `<div class="recommendation-card ${priorityClass}">`;
        analysisHtml += `<div class="rec-header">`;
        analysisHtml += `<div class="rec-title">${rec.title}</div>`;
        analysisHtml += `<div class="rec-priority ${rec.priority}">${rec.priority.toUpperCase()}</div>`;
        analysisHtml += `</div>`;
        analysisHtml += `<div class="rec-description">${rec.description}</div>`;

        if (rec.actions && rec.actions.length > 0) {
          if (rec.type === 'buttons') {
            analysisHtml += '<div class="button-actions">';
            analysisHtml += `<button class="try-intelligent-buttons-btn action-btn primary" data-rec-index="${index}">`;
            analysisHtml += '🧠 Try Intelligent Buttons</button>';
            analysisHtml += '</div>';

            analysisHtml += '<div class="button-preview">';
            rec.actions.forEach(action => {
              analysisHtml += `<div class="button-item">`;
              analysisHtml += `<span class="button-text">"${action.text}"</span>`;
              analysisHtml += `<span class="button-confidence">${action.probability}%</span>`;
              analysisHtml += `<div class="button-description">${action.description}</div>`;
              analysisHtml += `</div>`;
            });
            analysisHtml += '</div>';
          } else {
            analysisHtml += '<div class="action-list">';
            rec.actions.forEach(action => {
              analysisHtml += `<div class="action-item">• ${action.text}</div>`;
              if (action.description) {
                analysisHtml += `<div class="action-desc">${action.description}</div>`;
              }
            });
            analysisHtml += '</div>';
          }
        }

        analysisHtml += '</div>';
      });

      analysisHtml += '</div>';
    }

    // Framework Detection
    if (analysis.jsFramework) {
      analysisHtml += '<div class="framework-detection">';
      analysisHtml += '<h5>⚙️ Technology Stack</h5>';

      if (analysis.jsFramework.frameworks.length > 0) {
        analysisHtml += '<div class="framework-tags">';
        analysis.jsFramework.frameworks.forEach(framework => {
          analysisHtml += `<span class="framework-tag">${framework}</span>`;
        });
        analysisHtml += '</div>';
      }

      if (analysis.jsFramework.isDynamic) {
        analysisHtml += '<div class="dynamic-indicator">🌊 Dynamic content detected</div>';
      }

      analysisHtml += '</div>';
    }

    // Form Flow Analysis
    if (analysis.formFlows && analysis.formFlows.length > 0) {
      analysisHtml += '<div class="form-flows">';
      analysisHtml += '<h5>📋 Form Analysis</h5>';

      analysis.formFlows.forEach((flow, index) => {
        analysisHtml += '<div class="flow-item">';
        analysisHtml += `<div class="flow-title">Form ${index + 1}</div>`;

        if (flow.steps && flow.steps.length > 1) {
          analysisHtml += `<div class="flow-steps">Multi-step (${flow.steps.length} steps)</div>`;
        }

        if (flow.fields) {
          analysisHtml += '<div class="field-breakdown">';
          analysisHtml += `<span class="field-count">📝 ${flow.fields.total} fields</span>`;
          if (flow.fields.personal > 0) analysisHtml += `<span class="field-type">👤 ${flow.fields.personal}</span>`;
          if (flow.fields.work > 0) analysisHtml += `<span class="field-type">💼 ${flow.fields.work}</span>`;
          if (flow.fields.education > 0) analysisHtml += `<span class="field-type">🎓 ${flow.fields.education}</span>`;
          analysisHtml += '</div>';
        }

        analysisHtml += '</div>';
      });

      analysisHtml += '</div>';
    }

    // Page Structure Details (Collapsible)
    if (analysis.staticAnalysis) {
      analysisHtml += '<details class="page-details">';
      analysisHtml += '<summary>📊 Detailed Page Analysis</summary>';

      analysisHtml += '<div class="detail-section">';
      analysisHtml += '<h6>Page Information</h6>';
      analysisHtml += `<div class="detail-item"><strong>URL:</strong> ${analysis.staticAnalysis.url}</div>`;
      analysisHtml += `<div class="detail-item"><strong>Title:</strong> ${analysis.staticAnalysis.title}</div>`;

      if (analysis.staticAnalysis.pageStructure) {
        analysisHtml += `<div class="detail-item"><strong>DOM Depth:</strong> ${analysis.staticAnalysis.pageStructure.depth}</div>`;
        analysisHtml += `<div class="detail-item"><strong>Total Elements:</strong> ${analysis.staticAnalysis.pageStructure.totalElements}</div>`;
      }

      analysisHtml += '</div>';

      // Interactive Elements Summary
      if (analysis.interactiveElements) {
        analysisHtml += '<div class="detail-section">';
        analysisHtml += '<h6>Interactive Elements</h6>';
        if (analysis.interactiveElements.buttons) {
          analysisHtml += `<div class="detail-item">🔘 ${analysis.interactiveElements.buttons.length} buttons found</div>`;
        }
        if (analysis.interactiveElements.modals) {
          analysisHtml += `<div class="detail-item">📋 ${analysis.interactiveElements.modals.length} modals detected</div>`;
        }
        if (analysis.interactiveElements.tabs) {
          analysisHtml += `<div class="detail-item">📑 ${analysis.interactiveElements.tabs.length} tabs found</div>`;
        }
        analysisHtml += '</div>';
      }

      analysisHtml += '</details>';
    }

    analysisHtml += '</div>';

    // Add enhanced styling
    analysisHtml += this.getEnhancedAnalysisStyles();

    pageAnalysisDiv.innerHTML = analysisHtml;

    // Add event listeners for intelligent buttons
    this.attachIntelligentButtonListeners();
  }

  // Enhanced styling for the analysis display
  getEnhancedAnalysisStyles() {
    return `
      <style>
        .enhanced-analysis-section {
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.4;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(255,255,255,0.2);
        }

        .monitoring-status {
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #fff;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.8;
          margin-top: 4px;
        }

        .recommendations-section {
          margin-bottom: 20px;
        }

        .recommendation-card {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 12px;
          border-left: 4px solid;
        }

        .recommendation-card.high-priority {
          border-left-color: #dc3545;
          background: rgba(220,53,69,0.1);
        }

        .recommendation-card.medium-priority {
          border-left-color: #ffc107;
          background: rgba(255,193,7,0.1);
        }

        .recommendation-card.low-priority {
          border-left-color: #28a745;
          background: rgba(40,167,69,0.1);
        }

        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .rec-title {
          font-weight: 600;
          font-size: 14px;
        }

        .rec-priority {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .rec-priority.high {
          background: #dc3545;
          color: white;
        }

        .rec-priority.medium {
          background: #ffc107;
          color: #333;
        }

        .rec-priority.low {
          background: #28a745;
          color: white;
        }

        .rec-description {
          font-size: 13px;
          opacity: 0.9;
          margin-bottom: 10px;
        }

        .button-actions {
          margin: 10px 0;
        }

        .try-intelligent-buttons-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .try-intelligent-buttons-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .button-preview {
          margin-top: 10px;
          max-height: 120px;
          overflow-y: auto;
        }

        .button-item {
          background: rgba(255,255,255,0.05);
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .button-text {
          font-weight: 500;
          font-size: 12px;
          flex: 1;
        }

        .button-confidence {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          margin-left: 8px;
        }

        .button-description {
          width: 100%;
          font-size: 11px;
          opacity: 0.8;
          margin-top: 4px;
        }

        .framework-detection {
          margin-bottom: 15px;
        }

        .framework-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .framework-tag {
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .dynamic-indicator {
          margin-top: 8px;
          font-size: 12px;
          color: #17a2b8;
          font-weight: 500;
        }

        .form-flows {
          margin-bottom: 15px;
        }

        .flow-item {
          background: rgba(255,255,255,0.05);
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .flow-title {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .flow-steps {
          font-size: 12px;
          color: #ffc107;
          margin-bottom: 6px;
        }

        .field-breakdown {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .field-count {
          background: #6c757d;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .field-type {
          background: rgba(255,255,255,0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }

        .page-details {
          margin-top: 15px;
          background: rgba(255,255,255,0.05);
          border-radius: 6px;
          padding: 10px;
        }

        .page-details summary {
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .detail-section {
          margin-bottom: 12px;
        }

        .detail-section h6 {
          margin: 0 0 6px 0;
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-item {
          font-size: 11px;
          margin: 3px 0;
          opacity: 0.9;
        }

        .action-list {
          margin-top: 8px;
        }

        .action-item {
          font-size: 12px;
          margin: 4px 0;
          opacity: 0.9;
        }

        .action-desc {
          font-size: 11px;
          opacity: 0.7;
          margin-left: 12px;
          font-style: italic;
        }
      </style>
    `;
  }

  // Attach event listeners for intelligent button interactions
  attachIntelligentButtonListeners() {
    const intelligentButtons = document.querySelectorAll('.try-intelligent-buttons-btn');
    intelligentButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (this.tryIntelligentButtonsCallback) {
          e.target.disabled = true;
          e.target.textContent = '🔄 Trying buttons...';

          this.tryIntelligentButtonsCallback().then(result => {
            e.target.disabled = false;
            e.target.textContent = '🧠 Try Intelligent Buttons';

            if (result.success) {
              this.showStatus(result.message, 'success');
            } else {
              this.showStatus('Button interaction failed: ' + result.error, 'error');
            }
          }).catch(error => {
            e.target.disabled = false;
            e.target.textContent = '🧠 Try Intelligent Buttons';
            this.showStatus('Error: ' + error.message, 'error');
          });
        }
      });
    });
  }

  hidePageAnalysis() {
    this.elements.pageAnalysisDiv.style.display = 'none';
  }

  showCopyPasteHelper(data) {
    const copyPasteHelperDiv = this.elements.copyPasteHelperDiv;
    copyPasteHelperDiv.style.display = 'block';

    let helperHtml = '<div class="copy-paste-section">';
    helperHtml += '<h4>📋 Copy & Paste Helper</h4>';
    helperHtml += '<p>Click any section below to copy to clipboard:</p>';

    // Personal Info Section
    if (data.personal) {
      helperHtml += this.createCopySection('Personal Information',
        `Name: ${data.personal.full_name || 'N/A'}
Email: ${data.personal.email || 'N/A'}
Phone: ${data.personal.phone || 'N/A'}
Address: ${data.personal.address || 'N/A'}`);
    }

    // Work Experience Section
    if (data.experience && data.experience.length > 0) {
      const expText = data.experience.map(exp => this.formatExperience(exp)).join('\n\n');
      helperHtml += this.createCopySection('Work Experience', expText);
    }

    // Education Section
    if (data.education && data.education.length > 0) {
      const eduText = data.education.map(edu => this.formatEducation(edu)).join('\n');
      helperHtml += this.createCopySection('Education', eduText);
    }

    // Skills Section
    if (data.skills && data.skills.length > 0) {
      helperHtml += this.createCopySection('Skills', data.skills.join(', '));
    }

    // Summary Section
    const summary = this.generateSummaryForCopy(data);
    helperHtml += this.createCopySection('Professional Summary', summary);

    helperHtml += '</div>';
    copyPasteHelperDiv.innerHTML = helperHtml;

    // Add copy event listeners
    this.addCopyEventListeners();
  }

  hideCopyPasteHelper() {
    this.elements.copyPasteHelperDiv.style.display = 'none';
  }

  createCopySection(title, content) {
    return `
      <div class="copy-section" data-copy-content="${this.escapeHtml(content)}">
        <div class="copy-header">
          <h5>${title}</h5>
          <span class="copy-indicator">📋 Click to copy</span>
        </div>
        <div class="copy-content">${content.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }

  formatExperience(job) {
    let text = '';
    if (job.title) text += job.title;
    if (job.company) text += ` at ${job.company}`;
    if (job.dates) text += ` (${job.dates})`;
    if (job.description) text += `\n${job.description}`;
    return text;
  }

  formatEducation(edu) {
    let text = '';
    if (edu.degree) text += edu.degree;
    if (edu.school) text += ` - ${edu.school}`;
    if (edu.year) text += ` (${edu.year})`;
    return text;
  }

  generateSummaryForCopy(data) {
    let summary = '';

    if (data.experience && data.experience.length > 0) {
      const currentJob = data.experience[0];
      summary += `Experienced ${currentJob.title || 'professional'}`;
      if (currentJob.company) {
        summary += ` at ${currentJob.company}`;
      }
      summary += '. ';
    }

    if (data.skills && data.skills.length > 0) {
      summary += `Skilled in ${data.skills.slice(0, 5).join(', ')}. `;
    }

    if (data.education && data.education.length > 0) {
      const edu = data.education[0];
      summary += `${edu.degree || 'Graduate'} from ${edu.school || 'university'}. `;
    }

    summary += 'Passionate about delivering high-quality results and contributing to team success.';

    return summary;
  }

  addCopyEventListeners() {
    const copySections = document.querySelectorAll('.copy-section');
    copySections.forEach(section => {
      section.addEventListener('click', () => {
        const content = section.getAttribute('data-copy-content');
        navigator.clipboard.writeText(content).then(() => {
          const indicator = section.querySelector('.copy-indicator');
          const originalText = indicator.textContent;
          indicator.textContent = '✅ Copied!';
          indicator.style.color = '#28a745';

          setTimeout(() => {
            indicator.textContent = originalText;
            indicator.style.color = '';
          }, 2000);
        });
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setTryClickCallback(callback) {
    this.tryClickCallback = callback;
  }

  // New method for intelligent button callback
  setTryIntelligentButtonsCallback(callback) {
    this.tryIntelligentButtonsCallback = callback;
  }

  showDataSourceSelection() {
    const dataSourceSelection = document.getElementById('data-source-selection');
    if (dataSourceSelection) {
      dataSourceSelection.style.display = 'block';
    }
    this.hideResumeData();
  }

  hideDataSourceSelection() {
    const dataSourceSelection = document.getElementById('data-source-selection');
    if (dataSourceSelection) {
      dataSourceSelection.style.display = 'none';
    }
  }
}
