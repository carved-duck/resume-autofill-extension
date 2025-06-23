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
      'input[placeholder*="Given name" i]',
      // Japanese
      'input[name*="名"]',
      'input[id*="名"]',
      'input[placeholder*="名" i]',
      'input[placeholder*="下の名前" i]',
      'input[aria-label*="名" i]'
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
      'input[placeholder*="Surname" i]',
      // Japanese
      'input[name*="姓"]',
      'input[name*="苗字"]',
      'input[id*="姓"]',
      'input[placeholder*="姓" i]',
      'input[placeholder*="苗字" i]',
      'input[aria-label*="姓" i]'
    ],

    fullName: [
      'input[name*="fullName"]',
      'input[name*="full_name"]',
      'input[name*="name"]:not([name*="first"]):not([name*="last"]):not([name*="user"]):not([name*="company"])',
      'input[id*="fullName"]',
      'input[id*="full-name"]',
      'input[placeholder*="Full name" i]',
      'input[placeholder*="Your name" i]',
      // Japanese
      'input[name*="氏名"]',
      'input[name*="お名前"]',
      'input[name*="名前"]',
      'input[id*="氏名"]',
      'input[id*="名前"]',
      'input[placeholder*="氏名" i]',
      'input[placeholder*="お名前" i]',
      'input[placeholder*="名前" i]',
      'input[aria-label*="氏名" i]',
      'input[aria-label*="名前" i]'
    ],

    email: [
      'input[type="email"]',
      'input[name*="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]',
      // Japanese
      'input[name*="メール"]',
      'input[id*="メール"]',
      'input[placeholder*="メール" i]',
      'input[placeholder*="Eメール" i]',
      'input[aria-label*="メール" i]'
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
      'input[placeholder*="mobile" i]',
      // Japanese
      'input[name*="電話"]',
      'input[name*="携帯"]',
      'input[id*="電話"]',
      'input[placeholder*="電話" i]',
      'input[placeholder*="携帯" i]',
      'input[aria-label*="電話" i]'
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
      'input[placeholder*="Position" i]',
      // Japanese
      'input[name*="職種"]',
      'input[name*="役職"]',
      'input[name*="職業"]',
      'input[id*="職種"]',
      'input[placeholder*="職種" i]',
      'input[placeholder*="役職" i]',
      'input[aria-label*="職種" i]'
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
      'input[placeholder*="Employer" i]',
      // Japanese
      'input[name*="会社"]',
      'input[name*="企業"]',
      'input[name*="勤務先"]',
      'input[id*="会社"]',
      'input[placeholder*="会社" i]',
      'input[placeholder*="企業" i]',
      'input[placeholder*="勤務先" i]',
      'input[aria-label*="会社" i]'
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
      'input[placeholder*="College" i]',
      // Japanese
      'input[name*="学校"]',
      'input[name*="大学"]',
      'input[name*="専門学校"]',
      'input[name*="高校"]',
      'input[id*="学校"]',
      'input[id*="大学"]',
      'input[placeholder*="学校" i]',
      'input[placeholder*="大学" i]',
      'input[aria-label*="学校" i]'
    ],

    degree: [
      'input[name*="degree"]',
      'input[name*="qualification"]',
      'input[id*="degree"]',
      'select[name*="degree"]',
      'select[id*="degree"]',
      'input[placeholder*="degree" i]',
      // Japanese
      'input[name*="学歴"]',
      'input[name*="学位"]',
      'input[name*="専攻"]',
      'input[id*="学歴"]',
      'input[placeholder*="学歴" i]',
      'input[placeholder*="学位" i]',
      'select[name*="学歴"]',
      'input[aria-label*="学歴" i]'
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
      'textarea[placeholder*="Additional information" i]',
      // Japanese
      'textarea[name*="自己"]',
      'textarea[name*="志望"]',
      'textarea[name*="経歴"]',
      'textarea[name*="メッセージ"]',
      'textarea[id*="自己"]',
      'textarea[id*="志望"]',
      'textarea[placeholder*="自己紹介" i]',
      'textarea[placeholder*="志望動機" i]',
      'textarea[placeholder*="経歴" i]',
      'textarea[placeholder*="メッセージ" i]',
      'textarea[aria-label*="自己紹介" i]',
      'textarea[aria-label*="志望動機" i]'
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
    ],

    // Japanese-specific fields
    furiganaFirst: [
      'input[name*="furigana"]',
      'input[name*="kana"]',
      'input[placeholder*="フリガナ"]',
      'input[placeholder*="ふりがな"]',
      'input[aria-label*="フリガナ"]'
    ],

    furiganaLast: [
      'input[name*="furiganaLast"]',
      'input[name*="kanaLast"]',
      'input[placeholder*="姓のフリガナ"]'
    ],

    prefecture: [
      'select[name*="prefecture"]',
      'select[name*="ken"]',
      'select[placeholder*="都道府県"]',
      'input[name*="prefecture"]'
    ],

    city: [
      'input[name*="city"]',
      'input[name*="shi"]',
      'input[placeholder*="市区町村"]',
      'input[placeholder*="地名"]'
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

      // Profile creation forms (Japanese) - more specific selectors
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

      // Japanese-specific fields
      furiganaFirst: [
        'input[name*="furigana"]', 'input[name*="kana"]',
        'input[placeholder*="フリガナ"]', 'input[placeholder*="ふりがな"]',
        'input[aria-label*="フリガナ"]', 'input[id*="furigana"]'
      ],
      furiganaLast: [
        'input[name*="furiganaLast"]', 'input[name*="kanaLast"]',
        'input[placeholder*="姓のフリガナ"]'
      ],

      // Address fields - Japanese specific
      prefecture: [
        'select[name*="prefecture"]', 'select[name*="ken"]',
        'select[placeholder*="都道府県"]', 'input[name*="prefecture"]'
      ],
      city: [
        'input[name*="city"]', 'input[name*="shi"]',
        'input[placeholder*="市区町村"]', 'input[placeholder*="地名"]'
      ],
      address: [
        'input[name*="address"]', 'input[name*="banchi"]',
        'input[placeholder*="地名・番地"]', 'input[placeholder*="番地"]',
        'textarea[name*="address"]'
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

      // Profile sections - context-aware selectors
      selfIntroduction: [
        'textarea[name="summary"]', 'textarea[placeholder*="自己紹介"]',
        'textarea[id*="summary"]', 'textarea[placeholder*="経歴"]',
        'textarea[placeholder*="について"]', 'div[contenteditable="true"]'
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
      // Better selectors for GaijinPot based on their form structure
      firstName: [
        'input[name="first_name"]', 'input[id*="first_name"]',
        'input[name*="firstName"]', 'input[placeholder*="First name"]'
      ],
      lastName: [
        'input[name="last_name"]', 'input[id*="last_name"]',
        'input[name*="lastName"]', 'input[placeholder*="Last name"]'
      ],
      email: [
        'input[name="email"]', 'input[type="email"]',
        'input[id*="email"]'
      ],
      phone: [
        'input[name="phone"]', 'input[name="telephone"]',
        'input[type="tel"]', 'input[id*="phone"]'
      ],

      // Work experience fields - NOT education
      currentTitle: [
        'input[name*="job_title"]', 'input[name*="position"]',
        'input[name*="title"]', 'input[placeholder*="Job title"]'
      ],
      currentCompany: [
        'input[name*="company"]', 'input[name*="employer"]',
        'input[placeholder*="Company"]'
      ],

      // Actual education fields
      school: [
        'input[name*="school"]', 'input[name*="university"]',
        'input[name*="education"]', 'input[placeholder*="School"]'
      ],
      degree: [
        'input[name*="degree"]', 'select[name*="degree"]',
        'input[placeholder*="Degree"]'
      ],

      // Cover letter - not self-introduction
      coverLetter: [
        'textarea[name="cover_letter"]', 'textarea[name="message"]',
        'textarea[name*="motivation"]', 'textarea[placeholder*="Why"]'
      ]
    }
  };

  // Content script loaded successfully
  console.log('🚀 Resume Auto-Fill content script loaded on:', window.location.hostname);

  // Add page analysis system
  let pageAnalysis = null;

  function analyzePageStructure() {
    console.log('🔍 Analyzing page structure...');

    const analysis = {
      url: window.location.href,
      hostname: window.location.hostname,
      title: document.title,
      forms: [],
      inputs: [],
      textareas: [],
      contentEditables: [],
      buttons: [],
      sections: [],
      pageType: 'unknown',
      recommendedStrategy: 'standard'
    };

    // Analyze all forms
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const formData = {
        index,
        id: form.id,
        action: form.action,
        method: form.method,
        inputs: form.querySelectorAll('input').length,
        textareas: form.querySelectorAll('textarea').length,
        selects: form.querySelectorAll('select').length,
        element: form
      };
      analysis.forms.push(formData);
    });

    // Analyze all input fields
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, index) => {
      if (isFieldVisible(input)) {
        const inputData = {
          index,
          tag: input.tagName,
          type: input.type || 'text',
          name: input.name || '',
          id: input.id || '',
          placeholder: input.placeholder || '',
          required: input.required,
          value: input.value || '',
          className: input.className || '',
          parent: input.parentElement?.tagName || '',
          element: input
        };
        analysis.inputs.push(inputData);
      }
    });

    // Analyze textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea, index) => {
      if (isFieldVisible(textarea)) {
        const textareaData = {
          index,
          tag: textarea.tagName,
          name: textarea.name || '',
          id: textarea.id || '',
          placeholder: textarea.placeholder || '',
          required: textarea.required,
          value: textarea.value || '',
          className: textarea.className || '',
          rows: textarea.rows,
          element: textarea
        };
        analysis.textareas.push(textareaData);
      }
    });

    // Analyze contenteditable elements
    const contentEditables = document.querySelectorAll('[contenteditable="true"]');
    contentEditables.forEach((element, index) => {
      if (isFieldVisible(element)) {
        const editableData = {
          index,
          tag: element.tagName,
          id: element.id || '',
          className: element.className || '',
          text: element.textContent || '',
          innerHTML: element.innerHTML || '',
          element: element
        };
        analysis.contentEditables.push(editableData);
      }
    });

    // Analyze buttons and clickable elements
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]');
    buttons.forEach((button, index) => {
      if (isFieldVisible(button)) {
        const buttonData = {
          index,
          tag: button.tagName,
          type: button.type || '',
          text: button.textContent?.trim() || '',
          value: button.value || '',
          className: button.className || '',
          id: button.id || '',
          element: button
        };
        analysis.buttons.push(buttonData);
      }
    });

    // Identify page sections
    const sections = document.querySelectorAll('section, div[class*="section"], div[id*="section"], .form-section, .profile-section');
    sections.forEach((section, index) => {
      if (isFieldVisible(section)) {
        const sectionData = {
          index,
          tag: section.tagName,
          id: section.id || '',
          className: section.className || '',
          inputs: section.querySelectorAll('input').length,
          textareas: section.querySelectorAll('textarea').length,
          contentEditables: section.querySelectorAll('[contenteditable="true"]').length,
          text: section.textContent?.slice(0, 100) || '', // First 100 chars for context
          element: section
        };
        analysis.sections.push(sectionData);
      }
    });

    // Determine page type and strategy
    analysis.pageType = determinePageType(analysis);
    analysis.recommendedStrategy = getRecommendedStrategy(analysis);

    console.log('📊 Page Analysis Complete:', analysis);
    return analysis;
  }

  function determinePageType(analysis) {
    const url = analysis.url.toLowerCase();
    const title = analysis.title.toLowerCase();

    // Job application forms
    if (url.includes('/apply') || url.includes('/job') || title.includes('apply')) {
      return 'job_application';
    }

    // Profile/Resume builders
    if (url.includes('/profile') || url.includes('/resume') || title.includes('profile') || title.includes('resume')) {
      return 'profile_builder';
    }

    // Indeed specific patterns
    if (analysis.hostname.includes('indeed.com')) {
      if (url.includes('/profile')) {
        return 'indeed_profile';
      }
      if (url.includes('/apply')) {
        return 'indeed_application';
      }
    }

    // GaijinPot patterns
    if (analysis.hostname.includes('gaijinpot.com')) {
      if (url.includes('/apply')) {
        return 'gaijinpot_application';
      }
    }

    // Wantedly patterns
    if (analysis.hostname.includes('wantedly.com')) {
      return 'wantedly_application';
    }

    // Check for form complexity
    if (analysis.forms.length > 1 || analysis.sections.length > 3) {
      return 'complex_multi_section';
    }

    if (analysis.inputs.length > 10 || analysis.textareas.length > 3) {
      return 'detailed_form';
    }

    return 'simple_form';
  }

  function getRecommendedStrategy(analysis) {
    switch (analysis.pageType) {
      case 'indeed_profile':
        return 'sequential_section_filling';
      case 'complex_multi_section':
        return 'section_by_section';
      case 'profile_builder':
        return 'progressive_filling';
      case 'job_application':
        return 'standard_application_fill';
      default:
        return 'standard_fill';
    }
  }

    function getPageInsights(analysis) {
    const insights = [];

    insights.push(`📄 Page Type: ${analysis.pageType}`);
    insights.push(`🎯 Strategy: ${analysis.recommendedStrategy}`);
    insights.push(`📝 Found ${analysis.inputs.length} input fields`);
    insights.push(`📑 Found ${analysis.textareas.length} text areas`);
    insights.push(`✏️ Found ${analysis.contentEditables.length} editable sections`);
    insights.push(`🔗 Found ${analysis.buttons.length} buttons/actions`);
    insights.push(`📋 Found ${analysis.sections.length} page sections`);

    // Smart recommendations based on what we found
    const hasInputs = analysis.inputs.length > 0;
    const hasTextareas = analysis.textareas.length > 0;
    const hasButtons = analysis.buttons.length > 0;
    const hasEditableContent = analysis.contentEditables.length > 0;

    if (!hasInputs && !hasTextareas && !hasEditableContent && hasButtons) {
      insights.push('🎯 STRATEGY: Click-to-reveal interface detected! Need to click buttons to expose form fields');
      insights.push('💡 Recommendation: Try clicking edit buttons or section headers first');

      // Analyze button types to suggest which ones to click
      const editButtons = analysis.buttons.filter(btn =>
        btn.text.toLowerCase().includes('edit') ||
        btn.text.toLowerCase().includes('add') ||
        btn.text.toLowerCase().includes('追加') || // Japanese "add"
        btn.text.toLowerCase().includes('編集')    // Japanese "edit"
      );

      if (editButtons.length > 0) {
        insights.push(`🔍 Found ${editButtons.length} potential edit buttons to try clicking`);
      }
    }

    if (analysis.pageType === 'indeed_profile') {
      insights.push('💡 This is an Indeed profile page - sections need to be clicked to reveal edit forms');
    }

    if (analysis.pageType === 'profile_builder' && !hasInputs) {
      insights.push('💡 Profile builder detected but no forms visible - try clicking section edit buttons');
    }

    if (analysis.contentEditables.length > 0) {
      insights.push('💡 Page uses rich text editors - will use advanced filling techniques');
    }

    if (analysis.forms.length === 0 && analysis.inputs.length > 0) {
      insights.push('⚠️ No forms detected but inputs found - this may be a dynamic page');
    }

    if (analysis.inputs.length === 0 && analysis.textareas.length === 0 && analysis.buttons.length === 0) {
      insights.push('❌ No fillable fields or actionable buttons detected on this page');
    }

    // URL-specific insights
    if (analysis.url.includes('/resume') || analysis.url.includes('/profile')) {
      insights.push('📋 Resume/Profile page detected - look for edit buttons in each section');
    }

    return insights;
  }

    function findEditableButtons(analysis) {
    const editableButtons = [];

    // Look for buttons that likely reveal edit forms
    const editKeywords = [
      'edit', 'add', 'update', 'change', 'modify',
      '編集', '追加', '更新', '変更', // Japanese
      'plus', '+', 'pencil', '✏️', '📝'
    ];

    analysis.buttons.forEach(button => {
      const text = button.text.toLowerCase();
      const className = button.className.toLowerCase();
      const id = button.id.toLowerCase();

      // Check if button contains edit-related keywords
      const isEditButton = editKeywords.some(keyword =>
        text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
      );

      // Check for common patterns
      const hasEditIcon = text.includes('✏️') || text.includes('📝') || className.includes('edit') || className.includes('pencil');
      const hasAddIcon = text.includes('+') || className.includes('add') || className.includes('plus');
      const isExpandButton = className.includes('expand') || className.includes('collapse') || text.includes('▼') || text.includes('▲');

      if (isEditButton || hasEditIcon || hasAddIcon || isExpandButton) {
        editableButtons.push({
          ...button,
          reason: isEditButton ? 'Contains edit keyword' :
                 hasEditIcon ? 'Has edit icon' :
                 hasAddIcon ? 'Has add icon' :
                 'Appears to be expandable'
        });
      }
    });

    return editableButtons;
  }

  function tryClickingEditButtons() {
    console.log('🔍 Attempting to click edit buttons to reveal forms...');

    if (!pageAnalysis) {
      pageAnalysis = analyzePageStructure();
    }

    const editableButtons = findEditableButtons(pageAnalysis);
    let clickedButtons = 0;
    let newFields = 0;

    // Store original field counts
    const originalInputs = document.querySelectorAll('input').length;
    const originalTextareas = document.querySelectorAll('textarea').length;

    editableButtons.forEach((buttonData, index) => {
      try {
        const button = buttonData.element;
        if (button && isFieldVisible(button)) {
          console.log(`🖱️ Clicking button ${index + 1}: "${buttonData.text}" (${buttonData.reason})`);

          // Simulate a real click
          button.click();
          clickedButtons++;

          // Small delay between clicks to allow DOM updates
          setTimeout(() => {
            const currentInputs = document.querySelectorAll('input').length;
            const currentTextareas = document.querySelectorAll('textarea').length;
            const fieldsRevealed = (currentInputs + currentTextareas) - (originalInputs + originalTextareas);

            if (fieldsRevealed > 0) {
              console.log(`✅ Button click revealed ${fieldsRevealed} new form fields!`);
            }
          }, 100);
        }
      } catch (error) {
        console.warn('⚠️ Error clicking button:', error);
      }
    });

    // Wait a bit for all DOM updates to complete, then reanalyze
    setTimeout(() => {
      const updatedAnalysis = analyzePageStructure();
      const totalNewFields = (updatedAnalysis.inputs.length + updatedAnalysis.textareas.length) -
                            (originalInputs + originalTextareas);

      console.log(`📊 Click results: ${clickedButtons} buttons clicked, ${totalNewFields} new fields revealed`);

      if (totalNewFields > 0) {
        showNotification(`🎉 Success! Clicked ${clickedButtons} buttons and revealed ${totalNewFields} form fields`, 'success');
      } else if (clickedButtons > 0) {
        showNotification(`⚠️ Clicked ${clickedButtons} buttons but no new fields appeared`, 'warning');
      } else {
        showNotification('❌ No clickable edit buttons found', 'error');
      }
    }, 500);

    return {
      success: true,
      clickedButtons: clickedButtons,
      message: `Attempted to click ${clickedButtons} edit buttons`
    };
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    try {
      console.log('📬 Received message:', request.action);

      if (request.action === 'analyzePageStructure') {
        pageAnalysis = analyzePageStructure();
        const insights = getPageInsights(pageAnalysis);
        const editableButtons = findEditableButtons(pageAnalysis);

        sendResponse({
          success: true,
          analysis: pageAnalysis,
          insights: insights,
          editableButtons: editableButtons
        });
      } else if (request.action === 'tryClickToReveal') {
        const result = tryClickingEditButtons();
        sendResponse(result);
      } else if (request.action === 'fillForm') {
        console.log('📝 Starting auto-fill with data:', request.data);

        // Always analyze page first if not done already
        if (!pageAnalysis) {
          pageAnalysis = analyzePageStructure();
        }

        const result = fillFormWithData(request.data, pageAnalysis);
        sendResponse(result);
      } else if (request.action === 'ping') {
        // Simple ping test
        sendResponse({ success: true, message: 'Content script is working!' });
      }
    } catch (error) {
      console.error('❌ Content script error:', error);
      sendResponse({
        success: false,
        error: error.message || 'Unknown error occurred'
      });
    }
    return true; // Keep message channel open for async response
  });

  function fillFormWithData(data, analysis = null) {
    console.log('🎯 Filling form with resume data...');
    console.log('📊 Complete Resume data:', data);
    console.log('📊 Education data specifically:', data.education);
    console.log('📊 Experience data specifically:', data.experience);

    // Use analysis if provided, otherwise create new one
    if (!analysis) {
      analysis = analyzePageStructure();
    }

    console.log('📊 Using strategy:', analysis.recommendedStrategy);
    console.log('📄 Page type:', analysis.pageType);

    // Debug: Log analysis results
    console.log('🔍 ANALYSIS: Found elements:', {
      inputs: analysis.inputs.length,
      textareas: analysis.textareas.length,
      contentEditables: analysis.contentEditables.length,
      buttons: analysis.buttons.length,
      sections: analysis.sections.length
    });

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
        const language = detectLanguage();

        // Translate work experience data for Japanese sites
        let jobTitle = currentJob.title;
        let companyName = currentJob.company;

        if (language === 'ja') {
          if (jobTitle) jobTitle = translateWorkExperienceToJapanese(jobTitle);
          if (companyName) companyName = translateWorkExperienceToJapanese(companyName);
        }

        console.log('💼 Work Experience Debug:', { jobTitle, companyName, originalTitle: currentJob.title, originalCompany: currentJob.company });
        fieldsFound += fillField('currentTitle', jobTitle, filledFields);
        fieldsFound += fillField('currentCompany', companyName, filledFields);
      }

      // Education (most recent) - with data validation
      if (data.education && data.education.length > 0) {
        const recentEducation = data.education[0];

        // Validate that this is actually education data, not work experience
        const schoolName = recentEducation.school;
        const degreeName = recentEducation.degree;

        // Skip if school name looks like work experience (contains job titles or company patterns)
        const workKeywords = ['instructor', 'teacher', 'manager', 'director', 'engineer', 'developer', 'analyst', 'coordinator', 'assistant', 'specialist', 'representative', 'sales', 'marketing'];
        const isActuallyWork = schoolName && workKeywords.some(keyword =>
          schoolName.toLowerCase().includes(keyword.toLowerCase())
        );

        if (!isActuallyWork && schoolName) {
          const language = detectLanguage();
          let translatedSchoolName = schoolName;
          let translatedDegreeName = degreeName;

          if (language === 'ja') {
            translatedSchoolName = translateEducationToJapanese(schoolName);
            translatedDegreeName = translateEducationToJapanese(degreeName);
          }

          console.log('🎓 Education Debug:', {
            schoolName: translatedSchoolName,
            degreeName: translatedDegreeName,
            originalSchool: schoolName,
            originalDegree: degreeName,
            isValidEducation: !isActuallyWork
          });

          fieldsFound += fillField('school', translatedSchoolName, filledFields);
          if (translatedDegreeName) {
            fieldsFound += fillField('degree', translatedDegreeName, filledFields);
          }
        } else {
          console.log('🚫 Skipping invalid education data (appears to be work experience):', schoolName);
        }
      }

      // Japanese-specific fields (furigana)
      if (data.personal) {
        const language = detectLanguage();
        if (language === 'ja') {
          // Generate furigana for Japanese names if available
          const firstName = data.personal.first_name || extractFirstName(data.personal.full_name);
          const lastName = data.personal.last_name || extractLastName(data.personal.full_name);

          if (firstName) {
            const furiganaFirst = generateFurigana(firstName);
            fieldsFound += fillField('furiganaFirst', furiganaFirst, filledFields);
          }

          if (lastName) {
            const furiganaLast = generateFurigana(lastName);
            fieldsFound += fillField('furiganaLast', furiganaLast, filledFields);
          }

          // Handle Japanese addresses
          if (data.personal.address) {
            const addressParts = parseJapaneseAddress(data.personal.address);
            if (addressParts.prefecture) {
              fieldsFound += fillField('prefecture', addressParts.prefecture, filledFields);
            }
            if (addressParts.city) {
              fieldsFound += fillField('city', addressParts.city, filledFields);
            }
            if (addressParts.address) {
              fieldsFound += fillField('address', addressParts.address, filledFields);
            }
          }
        }
      }

      // Generate and fill context-appropriate content
      if (data.personal || data.experience) {
        const pageType = analysis ? analysis.pageType : 'unknown';
        const isProfilePage = pageType === 'profile_builder' || window.location.href.includes('profile');
        const isCoverLetterField = document.querySelector('textarea[name*="cover"], textarea[name*="motivation"], textarea[placeholder*="why" i]');

        if (isCoverLetterField) {
          // Only use formal cover letter for actual cover letter fields
          const coverLetter = generateSummary(data);
          fieldsFound += fillField('coverLetter', coverLetter, filledFields);
        } else {
          // Use simple self-introduction for profile fields
          const selfIntro = generateSelfIntroduction(data);
          fieldsFound += fillField('selfIntroduction', selfIntro, filledFields);
        }
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
          const language = detectLanguage();
          let experienceText;

          if (language === 'ja') {
            experienceText = data.experience.map(exp => {
              const title = translateWorkExperienceToJapanese(exp.title);
              const company = translateWorkExperienceToJapanese(exp.company);
              return `${title} (${company}) ${exp.dates || '最近'}\n${exp.description || ''}`;
            }).join('\n\n');
          } else {
            experienceText = data.experience.map(exp =>
              `${exp.title} at ${exp.company} (${exp.dates || 'Recent'})\n${exp.description || ''}`
            ).join('\n\n');
          }

          fieldsFound += fillField('workExperience', experienceText, filledFields);
        }

        if (data.education && data.education.length > 0) {
          const language = detectLanguage();
          let educationText;

          if (language === 'ja') {
            educationText = data.education.map(edu => {
              const degree = translateEducationToJapanese(edu.degree || '学位');
              const school = translateEducationToJapanese(edu.school);
              return `${school} ${degree} (${edu.dates || '最近'})`;
            }).join('\n');
          } else {
            educationText = data.education.map(edu =>
              `${edu.degree || 'Degree'} from ${edu.school} (${edu.dates || 'Recent'})`
            ).join('\n');
          }

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

  function detectLanguage() {
    // Simple language detection based on page content
    const title = document.title.toLowerCase();
    const bodyText = document.body.textContent.slice(0, 1000).toLowerCase();

    // Check for Japanese characters or common Japanese words
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(title + bodyText) ||
                       bodyText.includes('プロフィール') ||
                       bodyText.includes('履歴書') ||
                       bodyText.includes('経歴') ||
                       title.includes('japan') ||
                       window.location.hostname.includes('.jp');

    return hasJapanese ? 'ja' : 'en';
  }

  function generateSummary(data) {
    const language = detectLanguage();

    if (language === 'ja') {
      return generateJapaneseSummary(data);
    } else {
      return generateEnglishSummary(data);
    }
  }

  function generateSelfIntroduction(data) {
    const language = detectLanguage();

    if (language === 'ja') {
      return generateJapaneseSelfIntroduction(data);
    } else {
      return generateEnglishSelfIntroduction(data);
    }
  }

  function generateEnglishSelfIntroduction(data) {
    let intro = '';

    if (data.personal && data.personal.full_name) {
      intro += `I am ${data.personal.full_name}`;
    } else {
      intro += 'I am a dedicated professional';
    }

    if (data.experience && data.experience.length > 0) {
      const currentJob = data.experience[0];
      if (currentJob.title) {
        intro += ` with experience as a ${currentJob.title}`;
        if (currentJob.company) {
          intro += ` at ${currentJob.company}`;
        }
      }
    }

    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 5).join(', ');
      intro += `. My key skills include ${topSkills}`;
    }

    intro += '. I am passionate about contributing to meaningful work and continuous learning.';

    return intro;
  }

  function generateJapaneseSelfIntroduction(data) {
    let intro = '';

    if (data.personal && data.personal.full_name) {
      intro += `${data.personal.full_name}と申します。`;
    } else {
      intro += '私は専門的な経験を持つプロフェッショナルです。';
    }

    if (data.experience && data.experience.length > 0) {
      const currentJob = data.experience[0];
      if (currentJob.title && currentJob.company) {
        intro += `現在、${currentJob.company}にて${currentJob.title}として勤務しております。`;
      } else if (currentJob.title) {
        intro += `${currentJob.title}としての経験があります。`;
      }
    }

    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 5).join('、');
      intro += `私のスキルには${topSkills}などがあります。`;
    }

    intro += '意義のある仕事への貢献と継続的な学習に情熱を持っています。';

    return intro;
  }

  // Helper functions for Japanese field handling
  function extractFirstName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
  }

  function extractLastName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || '';
  }

  function generateFurigana(name) {
    // Simple furigana generation - in a real implementation, this would use a proper Japanese NLP library
    // For now, return the name as-is (user can manually edit)
    return name;
  }

  function parseJapaneseAddress(address) {
    // Simple Japanese address parsing
    const addressParts = {
      prefecture: '',
      city: '',
      address: address
    };

    // Common Japanese prefectures
    const prefectures = ['東京都', '大阪府', '京都府', '北海道', '神奈川県', '愛知県', '埼玉県', '千葉県', '兵庫県', '福岡県'];

    for (const prefecture of prefectures) {
      if (address.includes(prefecture)) {
        addressParts.prefecture = prefecture;
        const remaining = address.replace(prefecture, '').trim();

        // Try to extract city (市区町村)
        const cityMatch = remaining.match(/^([^0-9]+[市区町村])/);
        if (cityMatch) {
          addressParts.city = cityMatch[1];
          addressParts.address = remaining.replace(cityMatch[1], '').trim();
        } else {
          addressParts.address = remaining;
        }
        break;
      }
    }

    return addressParts;
  }

  function generateEnglishSummary(data) {
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

  function generateJapaneseSummary(data) {
    let summary = '';

    if (data.personal && data.personal.full_name) {
      summary += `採用ご担当者様\n\nお世話になっております。${data.personal.full_name}と申します。`;
    } else {
      summary += '採用ご担当者様\n\nお世話になっております。この度は貴重な機会をいただき、誠にありがとうございます。';
    }

    if (data.experience && data.experience.length > 0) {
      const currentJob = data.experience[0];
      if (currentJob.title && currentJob.company) {
        summary += `現在、${currentJob.company}にて${currentJob.title}として勤務しております。`;
      } else if (currentJob.title) {
        summary += `現在、${currentJob.title}として勤務しております。`;
      }
    }

    if (data.skills && data.skills.length > 0) {
      const topSkills = data.skills.slice(0, 5).join('、');
      summary += `私のスキルには${topSkills}などがございます。`;
    }

    summary += 'この度の募集要項を拝見し、私の経験とスキルを活かせる素晴らしい機会だと感じ、応募させていただきました。貴社の発展に貢献できるよう努力いたします。\n\nご検討のほど、よろしくお願いいたします。\n\n';

    if (data.personal && data.personal.full_name) {
      summary += data.personal.full_name;
    }

    return summary;
  }

  function translateEducationToJapanese(text) {
    if (!text) return text;

    // Common education translations
    const translations = {
      'University': '大学',
      'College': '大学',
      'High School': '高等学校',
      'School': '学校',
      'Bachelor': '学士',
      'Master': '修士',
      'Masters': '修士',
      'PhD': '博士',
      'Doctorate': '博士',
      'Degree': '学位',
      'Diploma': '卒業証書',
      'Certificate': '資格',
      'Education': '教育',
      'Student': '学生',
      'Graduate': '卒業生'
    };

    let translatedText = text;
    for (const [english, japanese] of Object.entries(translations)) {
      const regex = new RegExp(english, 'gi');
      translatedText = translatedText.replace(regex, japanese);
    }

    return translatedText;
  }

  function translateWorkExperienceToJapanese(text) {
    if (!text) return text;

    // Common work experience translations
    const translations = {
      'Teacher': '教師',
      'Instructor': '講師',
      'English Teacher': '英語教師',
      'English Instructor': '英語講師',
      'Manager': 'マネージャー',
      'Director': 'ディレクター',
      'Engineer': 'エンジニア',
      'Developer': '開発者',
      'Designer': 'デザイナー',
      'Consultant': 'コンサルタント',
      'Analyst': 'アナリスト',
      'Coordinator': 'コーディネーター',
      'Assistant': 'アシスタント',
      'Specialist': 'スペシャリスト',
      'Administrator': '管理者',
      'Representative': '代表',
      'Sales': '営業',
      'Marketing': 'マーケティング',
      'Company': '会社',
      'Corporation': '株式会社',
      'Ltd': '有限会社',
      'Inc': '株式会社',
      'School': '学校',
      'Institute': '研究所',
      'Academy': 'アカデミー',
      'Center': 'センター',
      'Office': 'オフィス',
      'Department': '部門',
      'Team': 'チーム',
      'Group': 'グループ'
    };

    let translatedText = text;
    for (const [english, japanese] of Object.entries(translations)) {
      const regex = new RegExp(english, 'gi');
      translatedText = translatedText.replace(regex, japanese);
    }

    return translatedText;
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
