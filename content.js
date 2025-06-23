// Content script for auto-filling job application forms
(function() {
  'use strict';

  console.log('🚀 Resume Auto-Fill content script loaded');

  // Form field selectors for different job sites
  const FIELD_SELECTORS = {
    // Personal Information
    firstName: [
      'input[name*="firstName"]',
      'input[name*="first_name"]',
      'input[name*="given_name"]',
      'input[name*="fname"]',
      'input[id*="firstName"]',
      'input[id*="first-name"]',
      'input[id*="fname"]',
      'input[placeholder*="First name" i]',
      'input[placeholder*="Given name" i]'
    ],

    lastName: [
      'input[name*="lastName"]',
      'input[name*="last_name"]',
      'input[name*="family_name"]',
      'input[name*="lname"]',
      'input[name*="surname"]',
      'input[id*="lastName"]',
      'input[id*="last-name"]',
      'input[id*="lname"]',
      'input[placeholder*="Last name" i]',
      'input[placeholder*="Family name" i]',
      'input[placeholder*="Surname" i]'
    ],

    fullName: [
      'input[name*="fullName"]',
      'input[name*="full_name"]',
      'input[name*="name"]:not([name*="first"]):not([name*="last"]):not([name*="user"]):not([name*="company"])',
      'input[id*="fullName"]',
      'input[id*="full-name"]',
      'input[placeholder*="Full name" i]',
      'input[placeholder*="Your name" i]'
    ],

    email: [
      'input[type="email"]',
      'input[name*="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]'
    ],

    phone: [
      'input[type="tel"]',
      'input[name*="phone"]',
      'input[name*="mobile"]',
      'input[name*="tel"]',
      'input[id*="phone"]',
      'input[id*="mobile"]',
      'input[id*="tel"]',
      'input[placeholder*="phone" i]',
      'input[placeholder*="mobile" i]'
    ],

    address: [
      'input[name*="address"]',
      'input[name*="street"]',
      'input[name*="location"]',
      'input[id*="address"]',
      'input[id*="street"]',
      'textarea[name*="address"]',
      'textarea[id*="address"]',
      'input[placeholder*="address" i]',
      'input[placeholder*="street" i]'
    ],

    linkedin: [
      'input[name*="linkedin"]',
      'input[name*="linkedIn"]',
      'input[id*="linkedin"]',
      'input[placeholder*="linkedin" i]',
      'input[placeholder*="LinkedIn" i]'
    ],

    github: [
      'input[name*="github"]',
      'input[name*="gitHub"]',
      'input[id*="github"]',
      'input[placeholder*="github" i]',
      'input[placeholder*="GitHub" i]'
    ],

    // Work Experience
    currentTitle: [
      'input[name*="currentTitle"]',
      'input[name*="current_title"]',
      'input[name*="jobTitle"]',
      'input[name*="job_title"]',
      'input[name*="position"]',
      'input[name*="title"]',
      'input[id*="current-title"]',
      'input[id*="job-title"]',
      'input[placeholder*="Current title" i]',
      'input[placeholder*="Job title" i]',
      'input[placeholder*="Position" i]'
    ],

    currentCompany: [
      'input[name*="currentCompany"]',
      'input[name*="current_company"]',
      'input[name*="employer"]',
      'input[name*="company"]',
      'input[name*="organization"]',
      'input[id*="current-company"]',
      'input[id*="employer"]',
      'input[placeholder*="Current company" i]',
      'input[placeholder*="Company" i]',
      'input[placeholder*="Employer" i]'
    ],

    // Education
    school: [
      'input[name*="school"]',
      'input[name*="university"]',
      'input[name*="college"]',
      'input[name*="institution"]',
      'input[name*="education"]',
      'input[id*="school"]',
      'input[id*="university"]',
      'input[id*="college"]',
      'input[placeholder*="School" i]',
      'input[placeholder*="University" i]',
      'input[placeholder*="College" i]'
    ],

    degree: [
      'input[name*="degree"]',
      'input[name*="qualification"]',
      'input[id*="degree"]',
      'select[name*="degree"]',
      'select[id*="degree"]',
      'input[placeholder*="degree" i]'
    ],

    // Cover Letter / Summary
    coverLetter: [
      'textarea[name*="coverLetter"]',
      'textarea[name*="cover_letter"]',
      'textarea[name*="summary"]',
      'textarea[name*="message"]',
      'textarea[name*="comments"]',
      'textarea[name*="why"]',
      'textarea[id*="cover-letter"]',
      'textarea[id*="summary"]',
      'textarea[placeholder*="cover letter" i]',
      'textarea[placeholder*="Tell us about yourself" i]',
      'textarea[placeholder*="Why are you interested" i]',
      'textarea[placeholder*="Additional information" i]'
    ],

    // Ultra-generic fallbacks for Indeed profile
    selfIntroduction: [
      'textarea',  // Any textarea
      '[contenteditable="true"]',  // Any contenteditable
      'div[contenteditable]'
    ],

    workExperience: [
      'textarea',
      '[contenteditable="true"]'
    ],

    education: [
      'textarea',
      '[contenteditable="true"]'
    ],

    skills: [
      'textarea',
      '[contenteditable="true"]'
    ],

    profileEmail: [
      'input[type="email"]',
      'input[name*="email"]',
      'input[id*="email"]'
    ],

    profilePhone: [
      'input[type="tel"]',
      'input[name*="phone"]',
      'input[id*="phone"]'
    ]
  };

  // Site-specific selectors for better accuracy
  const SITE_SPECIFIC_SELECTORS = {
    'linkedin.com': {
      firstName: ['input[name="firstName"]', 'input[id*="firstName"]'],
      lastName: ['input[name="lastName"]', 'input[id*="lastName"]'],
      email: ['input[name="email"]', 'input[type="email"]'],
      phone: ['input[name="phoneNumber"]', 'input[id*="phoneNumber"]']
    },

        'indeed.com': {
      // Job application forms
      fullName: ['input[name="applicant.name"]', 'input[id*="applicant-name"]'],
      email: ['input[name="applicant.emailAddress"]', 'input[id*="applicant-email"]'],
      phone: ['input[name="applicant.phoneNumber"]', 'input[id*="applicant-phone"]'],

      // Profile creation forms (Japanese) - more generic selectors
      firstName: [
        'input[name="firstName"]', 'input[id*="firstName"]',
        'input[name*="first"]', 'input[id*="first"]',
        'input[placeholder*="名前"]', 'input[placeholder*="First"]'
      ],
      lastName: [
        'input[name="lastName"]', 'input[id*="lastName"]',
        'input[name*="last"]', 'input[id*="last"]',
        'input[placeholder*="姓"]', 'input[placeholder*="Last"]'
      ],
      profileEmail: [
        'input[name="email"]', 'input[type="email"]',
        'input[id*="email"]', 'input[placeholder*="email"]',
        'input[placeholder*="メール"]'
      ],
      profilePhone: [
        'input[name="phone"]', 'input[name="phoneNumber"]',
        'input[id*="phone"]', 'input[placeholder*="phone"]',
        'input[placeholder*="電話"]'
      ],

      // Profile sections - very generic selectors
      selfIntroduction: [
        'textarea[name="summary"]', 'textarea[placeholder*="自己紹介"]',
        'div[contenteditable="true"]', 'textarea[id*="summary"]',
        'textarea[placeholder*="経歴"]', 'textarea[placeholder*="について"]',
        'textarea', '[contenteditable="true"]'  // Fallback to any textarea/contenteditable
      ],
      workExperience: [
        'textarea[name="experience"]', 'textarea[placeholder*="職歴"]',
        'textarea[id*="experience"]', 'textarea[placeholder*="経験"]',
        'textarea[placeholder*="職業"]'
      ],
      education: [
        'textarea[name="education"]', 'textarea[placeholder*="学歴"]',
        'textarea[id*="education"]', 'textarea[placeholder*="学校"]'
      ],
      skills: [
        'textarea[name="skills"]', 'textarea[placeholder*="スキル"]',
        'textarea[id*="skills"]', 'textarea[placeholder*="技術"]'
      ],
      languages: [
        'textarea[name="languages"]', 'textarea[placeholder*="語学"]',
        'textarea[id*="language"]', 'textarea[placeholder*="言語"]'
      ]
    },

    'glassdoor.com': {
      firstName: ['input[name="firstName"]'],
      lastName: ['input[name="lastName"]'],
      email: ['input[name="emailAddress"]']
    },

    'workday.com': {
      firstName: ['input[data-automation-id*="firstName"]'],
      lastName: ['input[data-automation-id*="lastName"]'],
      email: ['input[data-automation-id*="email"]'],
      phone: ['input[data-automation-id*="phone"]']
    },

    'wantedly.com': {
      fullName: ['input[name="name"]', 'input[placeholder*="名前"]', 'input[placeholder*="お名前"]'],
      email: ['input[name="email"]', 'input[type="email"]', 'input[placeholder*="メールアドレス"]'],
      phone: ['input[name="phone"]', 'input[placeholder*="電話番号"]'],
      message: ['textarea[name="message"]', 'textarea[placeholder*="メッセージ"]']
    },

    'gaijinpot.com': {
      firstName: ['input[name="first_name"]', 'input[id*="first_name"]'],
      lastName: ['input[name="last_name"]', 'input[id*="last_name"]'],
      email: ['input[name="email"]', 'input[type="email"]'],
      phone: ['input[name="phone"]', 'input[name="telephone"]'],
      coverLetter: ['textarea[name="cover_letter"]', 'textarea[name="message"]']
    }
  };

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'fillForm') {
      console.log('📝 Starting auto-fill with data:', request.data);
      const result = fillFormWithData(request.data);
      sendResponse(result);
    }
    return true; // Keep message channel open for async response
  });

  function fillFormWithData(data) {
    console.log('🎯 Filling form with resume data...');

    // Debug: Log all form elements on the page
    console.log('🔍 DEBUG: All input elements:', document.querySelectorAll('input'));
    console.log('🔍 DEBUG: All textarea elements:', document.querySelectorAll('textarea'));
    console.log('🔍 DEBUG: All contenteditable elements:', document.querySelectorAll('[contenteditable="true"]'));
    console.log('🔍 DEBUG: All form elements:', document.querySelectorAll('form *'));

    let fieldsFound = 0;
    const filledFields = [];

    try {
      // Personal Information
      if (data.personal) {
        fieldsFound += fillField('firstName', data.personal.first_name, filledFields);
        fieldsFound += fillField('lastName', data.personal.last_name, filledFields);
        fieldsFound += fillField('fullName', data.personal.full_name, filledFields);
        fieldsFound += fillField('email', data.personal.email, filledFields);
        fieldsFound += fillField('phone', data.personal.phone, filledFields);
        fieldsFound += fillField('address', data.personal.address, filledFields);
        fieldsFound += fillField('linkedin', data.personal.linkedin, filledFields);
        fieldsFound += fillField('github', data.personal.github, filledFields);
      }

      // Current Job (most recent experience)
      if (data.experience && data.experience.length > 0) {
        const currentJob = data.experience[0]; // Most recent
        fieldsFound += fillField('currentTitle', currentJob.title, filledFields);
        fieldsFound += fillField('currentCompany', currentJob.company, filledFields);
      }

      // Education (most recent)
      if (data.education && data.education.length > 0) {
        const recentEducation = data.education[0];
        fieldsFound += fillField('school', recentEducation.school, filledFields);
        fieldsFound += fillField('degree', recentEducation.degree, filledFields);
      }

      // Generate and fill cover letter/summary
      if (data.personal || data.experience) {
        const summary = generateSummary(data);
        fieldsFound += fillField('coverLetter', summary, filledFields);
        fieldsFound += fillField('selfIntroduction', summary, filledFields);
      }

      // Indeed Profile-specific fields
      if (window.location.hostname.includes('indeed.com')) {
        // Fill profile-specific email and phone
        if (data.personal) {
          fieldsFound += fillField('profileEmail', data.personal.email, filledFields);
          fieldsFound += fillField('profilePhone', data.personal.phone, filledFields);
        }

        // Fill detailed sections for profile
        if (data.experience && data.experience.length > 0) {
          const experienceText = data.experience.map(exp =>
            `${exp.title} at ${exp.company} (${exp.dates || 'Recent'})\n${exp.description || ''}`
          ).join('\n\n');
          fieldsFound += fillField('workExperience', experienceText, filledFields);
        }

        if (data.education && data.education.length > 0) {
          const educationText = data.education.map(edu =>
            `${edu.degree || 'Degree'} from ${edu.school} (${edu.dates || 'Recent'})`
          ).join('\n');
          fieldsFound += fillField('education', educationText, filledFields);
        }

        if (data.skills && data.skills.length > 0) {
          const skillsText = data.skills.join(', ');
          fieldsFound += fillField('skills', skillsText, filledFields);
        }
      }

      // Show visual feedback
      if (fieldsFound > 0) {
        highlightFilledFields(filledFields);
        showNotification(`✅ Auto-filled ${fieldsFound} fields successfully!`, 'success');
      } else {
        showNotification('⚠️ No compatible form fields found on this page', 'warning');
      }

      console.log(`📊 Auto-fill complete: ${fieldsFound} fields filled`);

      return {
        success: fieldsFound > 0,
        fieldsCount: fieldsFound,
        filledFields: filledFields
      };

    } catch (error) {
      console.error('❌ Error filling form:', error);
      showNotification('❌ Error filling form: ' + error.message, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  function fillField(fieldType, value, filledFields) {
    if (!value || typeof value !== 'string') return 0;

    const selectors = getSelectorsForField(fieldType);

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of elements) {
        if (element && isFieldVisible(element) && isFieldEmpty(element)) {
          try {
            if (element.tagName === 'SELECT') {
              if (fillSelectField(element, value)) {
                filledFields.push({ element, fieldType, value });
                console.log(`✅ Filled ${fieldType} (SELECT):`, selector, value);
                return 1;
              }
            } else {
              fillInputField(element, value);
              filledFields.push({ element, fieldType, value });
              console.log(`✅ Filled ${fieldType}:`, selector, value);
              return 1;
            }
          } catch (e) {
            console.warn('⚠️ Error filling field:', e);
          }
        }
      }
    }

    return 0; // No field filled
  }

  function getSelectorsForField(fieldType) {
    const hostname = window.location.hostname;
    const siteSpecific = SITE_SPECIFIC_SELECTORS[hostname];

    // Combine site-specific selectors with general selectors
    const selectors = [];

    if (siteSpecific && siteSpecific[fieldType]) {
      selectors.push(...siteSpecific[fieldType]);
    }

    if (FIELD_SELECTORS[fieldType]) {
      selectors.push(...FIELD_SELECTORS[fieldType]);
    }

    return selectors;
  }

  function fillInputField(element, value) {
    // Focus the element first
    element.focus();

    // Handle contenteditable divs (used by Indeed profile)
    if (element.contentEditable === 'true') {
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Handle textarea elements
    if (element.tagName === 'TEXTAREA') {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Handle regular input elements
    // Clear existing value
    element.value = '';

    // Set the new value
    element.value = value;

    // Trigger events that frameworks might be listening for
    const events = ['input', 'change', 'blur', 'keyup', 'keydown'];

    events.forEach(eventType => {
      const event = new Event(eventType, {
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
    });

    // For React/Vue components, also try setting the _valueTracker
    if (element._valueTracker) {
      element._valueTracker.setValue('');
      element._valueTracker.setValue(value);
    }

    // Special handling for React inputs
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function fillSelectField(element, value) {
    const options = Array.from(element.querySelectorAll('option'));

    // Try exact match first
    let matchedOption = options.find(option =>
      option.textContent.trim().toLowerCase() === value.toLowerCase()
    );

    // Try partial match
    if (!matchedOption) {
      matchedOption = options.find(option =>
        option.textContent.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(option.textContent.toLowerCase())
      );
    }

    if (matchedOption) {
      element.value = matchedOption.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  }

  function isFieldVisible(element) {
    // Check if element is visible and interactable
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           !element.disabled &&
           !element.readOnly &&
           element.offsetParent !== null &&
           rect.width > 0 &&
           rect.height > 0;
  }

  function isFieldEmpty(element) {
    return !element.value || element.value.trim() === '';
  }

  function generateSummary(data) {
    let summary = '';

    if (data.personal && data.personal.full_name) {
      summary += `Dear Hiring Manager,\n\nI am ${data.personal.full_name}`;
    } else {
      summary += 'Dear Hiring Manager,\n\nI am excited to apply for this position';
    }

    if (data.experience && data.experience.length > 0) {
      const currentJob = data.experience[0];
      if (currentJob.title) {
        summary += `, currently working as a ${currentJob.title}`;
        if (currentJob.company) {
          summary += ` at ${currentJob.company}`;
        }
      }
    }

    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 5).join(', ');
      summary += `. My key skills include ${topSkills}`;
    }

    summary += '. I am excited about this opportunity and believe my experience and skills make me a strong candidate for this position. I look forward to discussing how I can contribute to your team.\n\nBest regards,\n';

    if (data.personal && data.personal.full_name) {
      summary += data.personal.full_name;
    }

    return summary;
  }

  function highlightFilledFields(filledFields) {
    filledFields.forEach(({ element }) => {
      element.classList.add('resume-autofill-highlight');

      // Remove highlight after 3 seconds
      setTimeout(() => {
        element.classList.remove('resume-autofill-highlight');
      }, 3000);
    });
  }

  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.resume-autofill-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'resume-autofill-notification';
    notification.innerHTML = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 16px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: white;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      cursor: pointer;
    `;

    // Style based on type
    switch (type) {
      case 'success':
        notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        break;
      case 'warning':
        notification.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
        notification.style.color = '#212529';
        break;
      case 'error':
        notification.style.background = 'linear-gradient(135deg, #dc3545, #e83e8c)';
        break;
      default:
        notification.style.background = 'linear-gradient(135deg, #007bff, #6f42c1)';
    }

    // Add click to dismiss
    notification.addEventListener('click', () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    });

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }

})();
