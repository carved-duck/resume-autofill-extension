// Form Filling Module
// Contains all logic for filling forms with resume data

class FormFiller {
  constructor() {
    this.resumeData = null;
  }

  // Main form filling function
  fillFormWithResumeData(data) {
    console.log('📝 Starting Enhanced Form Fill with Dynamic Awareness...');
    console.log('📊 Complete Resume data received:', data);

    // Validate input data
    if (!data || typeof data !== 'object') {
      console.error('❌ Invalid resume data provided');
      return {
        success: false,
        fieldsCount: 0,
        message: 'Invalid resume data provided'
      };
    }

    this.resumeData = data;

    try {
      let fieldsFound = 0;
      const currentSite = window.location.hostname;
      console.log(`🌐 Current site: ${currentSite}`);

      // Get site-specific selectors if available
      const siteSelectors = window.SITE_SPECIFIC_SELECTORS[currentSite] || {};
      console.log('🎯 Site-specific selectors:', Object.keys(siteSelectors).length > 0 ? Object.keys(siteSelectors) : 'None found, using generic selectors');

      // Fill personal information
      if (data.personal_info) {
        console.log('👤 Filling personal information...');
        fieldsFound += this.fillPersonalInfo(data.personal_info, siteSelectors);
      }

      // Fill work experience
      if (data.work_experience && Array.isArray(data.work_experience) && data.work_experience.length > 0) {
        console.log('💼 Filling work experience...');
        fieldsFound += this.fillWorkExperience(data.work_experience[0], siteSelectors);
      }

      // Fill education
      if (data.education && Array.isArray(data.education) && data.education.length > 0) {
        console.log('🎓 Filling education...');
        fieldsFound += this.fillEducation(data.education[0], siteSelectors);
      }

      // Fill text content (cover letter, skills, etc.)
      console.log('📄 Filling text content...');
      fieldsFound += this.fillTextContent(data, siteSelectors);

      const result = {
        success: fieldsFound > 0,
        fieldsCount: fieldsFound,
        message: fieldsFound > 0
          ? `Successfully filled ${fieldsFound} fields`
          : 'No matching form fields found on this page'
      };

      console.log('✅ Form filling complete:', result);
      return result;

    } catch (error) {
      console.error('❌ Error during form filling:', error);
      return {
        success: false,
        fieldsCount: 0,
        message: 'Error occurred during form filling: ' + error.message
      };
    }
  }

  // Fill personal information fields
  fillPersonalInfo(personal, siteSelectors) {
    let filled = 0;

    // Name fields
    if (personal.full_name) {
      filled += this.fillField('fullName', personal.full_name, siteSelectors);

      // Also try to fill first/last name if full name exists
      const nameParts = personal.full_name.split(' ');
      if (nameParts.length >= 2) {
        filled += this.fillField('firstName', nameParts[0], siteSelectors);
        filled += this.fillField('lastName', nameParts.slice(1).join(' '), siteSelectors);
      }
    }

    // Individual name fields
    if (personal.first_name) {
      filled += this.fillField('firstName', personal.first_name, siteSelectors);
    }
    if (personal.last_name) {
      filled += this.fillField('lastName', personal.last_name, siteSelectors);
    }

    // Contact information
    if (personal.email) {
      filled += this.fillField('email', personal.email, siteSelectors);
    }
    if (personal.phone) {
      filled += this.fillField('phone', personal.phone, siteSelectors);
    }
    if (personal.address) {
      filled += this.fillField('address', personal.address, siteSelectors);
    }

    // Social profiles
    if (personal.linkedin) {
      filled += this.fillField('linkedin', personal.linkedin, siteSelectors);
    }
    if (personal.github) {
      filled += this.fillField('github', personal.github, siteSelectors);
    }

    console.log(`👤 Personal info: filled ${filled} fields`);
    return filled;
  }

  // Fill work experience fields
  fillWorkExperience(experience, siteSelectors) {
    let filled = 0;

    if (experience.title) {
      filled += this.fillField('currentTitle', experience.title, siteSelectors);
    }
    if (experience.company) {
      filled += this.fillField('currentCompany', experience.company, siteSelectors);
    }

    console.log(`💼 Work experience: filled ${filled} fields`);
    return filled;
  }

  // Fill education fields
  fillEducation(education, siteSelectors) {
    let filled = 0;

    if (education.institution) {
      filled += this.fillField('school', education.institution, siteSelectors);
    }
    if (education.degree) {
      filled += this.fillField('degree', education.degree, siteSelectors);
    }

    console.log(`🎓 Education: filled ${filled} fields`);
    return filled;
  }

  // Fill text content (cover letter, skills, etc.)
  fillTextContent(data, siteSelectors) {
    let filled = 0;

    // Skills
    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      const skillsText = data.skills.join(', ');
      filled += this.fillField('skills', skillsText, siteSelectors);
    }

    // Cover letter
    const coverLetter = this.generateCoverLetter(data);
    if (coverLetter) {
      filled += this.fillField('coverLetter', coverLetter, siteSelectors);
      filled += this.fillField('selfIntroduction', coverLetter, siteSelectors);
    }

    console.log(`📄 Text content: filled ${filled} fields`);
    return filled;
  }

  // Fill individual field
  fillField(fieldType, value, siteSelectors) {
    if (!value) return 0;

    console.log(`🔍 Looking for ${fieldType} field with value: ${value}`);

    // Try site-specific selectors first
    if (siteSelectors && siteSelectors[fieldType]) {
      for (const selector of siteSelectors[fieldType]) {
        const element = document.querySelector(selector);
        if (element && this.isFieldVisible(element) && this.isFieldEmpty(element)) {
          this.setFieldValue(element, value);
          console.log(`✅ Filled ${fieldType} using site-specific selector: ${selector}`);
          return 1;
        }
      }
    }

    // Try generic selectors
    if (window.FIELD_SELECTORS && window.FIELD_SELECTORS[fieldType]) {
      for (const selector of window.FIELD_SELECTORS[fieldType]) {
        const element = document.querySelector(selector);
        if (element && this.isFieldVisible(element) && this.isFieldEmpty(element)) {
          this.setFieldValue(element, value);
          console.log(`✅ Filled ${fieldType} using generic selector: ${selector}`);
          return 1;
        }
      }
    }

    console.log(`❌ No suitable ${fieldType} field found for value: ${value}`);
    return 0;
  }

  // Check if field is visible
  isFieldVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0 &&
           !element.hasAttribute('hidden');
  }

  // Check if field is empty
  isFieldEmpty(element) {
    if (!element) return false;

    const value = element.value || element.textContent || '';
    const trimmedValue = value.trim();

    // Consider field empty if it's truly empty or has placeholder-like content
    return trimmedValue === '' ||
           trimmedValue.toLowerCase().includes('enter') ||
           trimmedValue.toLowerCase().includes('type') ||
           trimmedValue.toLowerCase().includes('select');
  }

  // Set field value
  setFieldValue(element, value) {
    if (!element || !value) return;

    try {
      // Handle different input types
      if (element.tagName.toLowerCase() === 'select') {
        this.selectOptionByText(element, value);
      } else if (element.tagName.toLowerCase() === 'textarea' || element.type === 'text' || element.type === 'email' || element.type === 'tel') {
        element.focus();
        element.value = value;

        // Trigger events to ensure proper form handling
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.blur();
      }
    } catch (error) {
      console.error('Error setting field value:', error);
    }
  }

  // Select option by text
  selectOptionByText(selectElement, text) {
    if (!selectElement || !text) return false;

    const options = selectElement.querySelectorAll('option');
    for (const option of options) {
      if (option.textContent.toLowerCase().includes(text.toLowerCase())) {
        selectElement.value = option.value;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // Generate cover letter
  generateCoverLetter(data) {
    const language = this.detectLanguage();

    if (language === 'ja') {
      return this.generateJapaneseCoverLetter(data);
    } else {
      return this.generateEnglishCoverLetter(data);
    }
  }

  // Generate English cover letter
  generateEnglishCoverLetter(data) {
    const personal = data.personal_info || {};
    const experience = data.work_experience?.[0] || {};
    const skills = data.skills || [];

    let letter = `Dear Hiring Manager,\n\n`;

    if (personal.full_name) {
      letter += `I am ${personal.full_name}, `;
    } else {
      letter += `I am `;
    }

    if (experience.title && experience.company) {
      letter += `currently working as ${experience.title} at ${experience.company}. `;
    } else if (experience.title) {
      letter += `an experienced ${experience.title}. `;
    } else {
      letter += `a dedicated professional. `;
    }

    letter += `I am writing to express my strong interest in joining your team.\n\n`;

    if (skills.length > 0) {
      letter += `My key skills include ${skills.slice(0, 5).join(', ')}. `;
    }

    letter += `I believe my background and enthusiasm make me a great fit for this role.\n\n`;
    letter += `I look forward to discussing how I can contribute to your organization.\n\n`;
    letter += `Best regards`;

    if (personal.full_name) {
      letter += `,\n${personal.full_name}`;
    }

    return letter;
  }

  // Generate Japanese cover letter
  generateJapaneseCoverLetter(data) {
    const personal = data.personal_info || {};
    const experience = data.work_experience?.[0] || {};
    const skills = data.skills || [];

    let letter = `拝啓　貴社ますますご繁栄のこととお慶び申し上げます。\n\n`;

    if (personal.full_name) {
      letter += `私は${personal.full_name}と申します。`;
    } else {
      letter += `私は`;
    }

    if (experience.title && experience.company) {
      letter += `現在${experience.company}にて${experience.title}として勤務しております。`;
    } else if (experience.title) {
      letter += `${experience.title}としての経験を積んでまいりました。`;
    }

    letter += `\n\nこの度、貴社の求人に大変興味を持ち、応募させていただきました。\n\n`;

    if (skills.length > 0) {
      letter += `私の主なスキルは${skills.slice(0, 3).join('、')}などです。`;
    }

    letter += `これまでの経験を活かし、貴社の発展に貢献できるよう努力いたします。\n\n`;
    letter += `ご検討のほど、よろしくお願い申し上げます。\n\n敬具`;

    return letter;
  }

  // Detect page language
  detectLanguage() {
    const htmlLang = document.documentElement.lang || '';
    const bodyText = document.body.textContent || '';

    return htmlLang.includes('ja') || /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(bodyText) ? 'ja' : 'en';
  }
}

// Export to global scope
window.FormFiller = FormFiller;

console.log('📝 Form Filler module loaded');
