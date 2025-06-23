// Site-specific selectors and field mappings
// Extracted from content.js for better maintainability

export const FIELD_SELECTORS = {
  // Personal Information
  firstName: [
    'input[name*="firstName"]',
    'input[name*="first_name"]',
    'input[name*="first"]',
    'input[id*="firstName"]',
    'input[id*="first-name"]',
    'input[placeholder*="First name" i]',
    'input[placeholder*="Given name" i]',
    // Japanese
    'input[name*="名前"]',
    'input[id*="名前"]',
    'input[placeholder*="名前" i]',
    'input[aria-label*="名前" i]'
  ],

  lastName: [
    'input[name*="lastName"]',
    'input[name*="last_name"]',
    'input[name*="last"]',
    'input[id*="lastName"]',
    'input[id*="last-name"]',
    'input[placeholder*="Last name" i]',
    'input[placeholder*="Family name" i]',
    // Japanese
    'input[name*="姓"]',
    'input[id*="姓"]',
    'input[placeholder*="姓" i]',
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

  // Profile-specific fields
  selfIntroduction: [
    'textarea',
    '[contenteditable="true"]',
    'div[contenteditable]'
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

export const SITE_SPECIFIC_SELECTORS = {
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

    // Profile sections - context-aware selectors
    selfIntroduction: [
      'textarea[name="summary"]', 'textarea[placeholder*="自己紹介"]',
      'textarea[id*="summary"]', 'textarea[placeholder*="経歴"]',
      'textarea[placeholder*="について"]', 'div[contenteditable="true"]'
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
