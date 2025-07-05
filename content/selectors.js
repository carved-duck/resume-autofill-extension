// Content Script Selectors Module
// Comprehensive field selectors and site-specific mappings

// Prevent multiple loading
if (window.resumeAutoFillSelectorsLoaded) {
  console.log('⚠️ Selectors module already loaded, skipping...');
} else {
  window.resumeAutoFillSelectorsLoaded = true;

  console.log('🎯 Loading field selectors...');

  // Form Field Selectors Module
  // Contains all field selectors for different job sites

  const FIELD_SELECTORS = {
    // Personal Information
    firstName: [
      'input[name*="firstName"]',
      'input[name*="first_name"]',
      'input[name*="first"]',
      'input[name*="given_name"]',
      'input[name*="fname"]',
      'input[id*="firstName"]',
      'input[id*="first-name"]',
      'input[id*="fname"]',
      'input[placeholder*="First name" i]',
      'input[placeholder*="Given name" i]',
      // Japanese
      'input[name*="名前"]',
      'input[name*="名"]',
      'input[id*="名前"]',
      'input[id*="名"]',
      'input[placeholder*="名前" i]',
      'input[placeholder*="下の名前" i]',
      'input[aria-label*="名前" i]',
      'input[aria-label*="名" i]'
    ],

    lastName: [
      'input[name*="lastName"]',
      'input[name*="last_name"]',
      'input[name*="last"]',
      'input[name*="family_name"]',
      'input[name*="surname"]',
      'input[name*="lname"]',
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
      'input[id*="苗字"]',
      'input[placeholder*="姓" i]',
      'input[placeholder*="苗字" i]',
      'input[aria-label*="姓" i]',
      'input[aria-label*="苗字" i]'
    ],

    fullName: [
      'input[name*="fullName"]',
      'input[name*="full_name"]',
      'input[name*="name"]:not([name*="first"]):not([name*="last"]):not([name*="user"]):not([name*="company"])',
      'input[id*="fullName"]',
      'input[id*="full-name"]',
      'input[placeholder*="Full name" i]',
      'input[placeholder*="Your name" i]',
      'input[placeholder*="Name" i]',
      // Japanese
      'input[name*="氏名"]',
      'input[name*="お名前"]',
      'input[id*="氏名"]',
      'input[placeholder*="氏名" i]',
      'input[placeholder*="お名前" i]',
      'input[aria-label*="氏名" i]',
      'input[aria-label*="お名前" i]'
    ],

    email: [
      'input[type="email"]',
      'input[name*="email"]',
      'input[name*="Email"]',
      'input[name*="e-mail"]',
      'input[id*="email"]',
      'input[id*="Email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="e-mail" i]',
      // Japanese
      'input[name*="メール"]',
      'input[name*="Eメール"]',
      'input[name*="電子メール"]',
      'input[id*="メール"]',
      'input[placeholder*="メール" i]',
      'input[placeholder*="Eメール" i]',
      'input[aria-label*="メール" i]'
    ],

    phone: [
      'input[type="tel"]',
      'input[name*="phone"]',
      'input[name*="Phone"]',
      'input[name*="mobile"]',
      'input[name*="tel"]',
      'input[name*="telephone"]',
      'input[id*="phone"]',
      'input[id*="mobile"]',
      'input[id*="tel"]',
      'input[placeholder*="phone" i]',
      'input[placeholder*="mobile" i]',
      'input[placeholder*="telephone" i]',
      // Japanese
      'input[name*="電話"]',
      'input[name*="携帯"]',
      'input[name*="TEL"]',
      'input[id*="電話"]',
      'input[id*="携帯"]',
      'input[placeholder*="電話" i]',
      'input[placeholder*="携帯" i]',
      'input[aria-label*="電話" i]',
      'input[aria-label*="携帯" i]'
    ],

    address: [
      'input[name*="address"]',
      'input[name*="Address"]',
      'input[name*="street"]',
      'input[name*="location"]',
      'input[name*="residence"]',
      'input[id*="address"]',
      'input[id*="street"]',
      'input[id*="location"]',
      'textarea[name*="address"]',
      'textarea[id*="address"]',
      'input[placeholder*="address" i]',
      'input[placeholder*="street" i]',
      'input[placeholder*="location" i]',
      // Japanese
      'input[name*="住所"]',
      'input[name*="所在地"]',
      'input[id*="住所"]',
      'input[placeholder*="住所" i]',
      'input[aria-label*="住所" i]'
    ],

    linkedin: [
      'input[name*="linkedin"]',
      'input[name*="linkedIn"]',
      'input[name*="LinkedIn"]',
      'input[id*="linkedin"]',
      'input[id*="LinkedIn"]',
      'input[placeholder*="linkedin" i]',
      'input[placeholder*="LinkedIn" i]',
      'input[placeholder*="LinkedIn profile" i]'
    ],

    github: [
      'input[name*="github"]',
      'input[name*="gitHub"]',
      'input[name*="GitHub"]',
      'input[id*="github"]',
      'input[id*="GitHub"]',
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
      'input[name*="role"]',
      'input[name*="occupation"]',
      'input[id*="current-title"]',
      'input[id*="job-title"]',
      'input[id*="position"]',
      'input[placeholder*="Current title" i]',
      'input[placeholder*="Job title" i]',
      'input[placeholder*="Position" i]',
      'input[placeholder*="Role" i]',
      // Japanese
      'input[name*="職種"]',
      'input[name*="役職"]',
      'input[name*="職業"]',
      'input[name*="職位"]',
      'input[id*="職種"]',
      'input[id*="役職"]',
      'input[placeholder*="職種" i]',
      'input[placeholder*="役職" i]',
      'input[aria-label*="職種" i]',
      'input[aria-label*="役職" i]'
    ],

    currentCompany: [
      'input[name*="currentCompany"]',
      'input[name*="current_company"]',
      'input[name*="employer"]',
      'input[name*="company"]',
      'input[name*="organization"]',
      'input[name*="workplace"]',
      'input[id*="current-company"]',
      'input[id*="employer"]',
      'input[id*="company"]',
      'input[placeholder*="Current company" i]',
      'input[placeholder*="Company" i]',
      'input[placeholder*="Employer" i]',
      'input[placeholder*="Organization" i]',
      // Japanese
      'input[name*="会社"]',
      'input[name*="企業"]',
      'input[name*="勤務先"]',
      'input[name*="職場"]',
      'input[id*="会社"]',
      'input[id*="企業"]',
      'input[placeholder*="会社" i]',
      'input[placeholder*="企業" i]',
      'input[placeholder*="勤務先" i]',
      'input[aria-label*="会社" i]',
      'input[aria-label*="企業" i]'
    ],

    // Education
    school: [
      'input[name*="school"]',
      'input[name*="university"]',
      'input[name*="college"]',
      'input[name*="institution"]',
      'input[name*="education"]',
      'input[name*="academy"]',
      'input[id*="school"]',
      'input[id*="university"]',
      'input[id*="college"]',
      'input[id*="institution"]',
      'input[placeholder*="School" i]',
      'input[placeholder*="University" i]',
      'input[placeholder*="College" i]',
      'input[placeholder*="Institution" i]',
      // Japanese
      'input[name*="学校"]',
      'input[name*="大学"]',
      'input[name*="専門学校"]',
      'input[name*="高校"]',
      'input[name*="教育機関"]',
      'input[id*="学校"]',
      'input[id*="大学"]',
      'input[placeholder*="学校" i]',
      'input[placeholder*="大学" i]',
      'input[aria-label*="学校" i]',
      'input[aria-label*="大学" i]'
    ],

    degree: [
      'input[name*="degree"]',
      'input[name*="qualification"]',
      'input[name*="diploma"]',
      'input[name*="major"]',
      'input[name*="field"]',
      'input[id*="degree"]',
      'input[id*="qualification"]',
      'select[name*="degree"]',
      'select[id*="degree"]',
      'input[placeholder*="degree" i]',
      'input[placeholder*="qualification" i]',
      'input[placeholder*="major" i]',
      // Japanese
      'input[name*="学歴"]',
      'input[name*="学位"]',
      'input[name*="専攻"]',
      'input[name*="学部"]',
      'input[id*="学歴"]',
      'input[id*="学位"]',
      'input[placeholder*="学歴" i]',
      'input[placeholder*="学位" i]',
      'select[name*="学歴"]',
      'input[aria-label*="学歴" i]',
      'input[aria-label*="学位" i]'
    ],

    // Skills
    skills: [
      'input[name*="skills"]',
      'input[name*="skill"]',
      'input[name*="competencies"]',
      'input[name*="abilities"]',
      'input[name*="expertise"]',
      'textarea[name*="skills"]',
      'textarea[name*="skill"]',
      'input[id*="skills"]',
      'textarea[id*="skills"]',
      'input[placeholder*="skills" i]',
      'input[placeholder*="competencies" i]',
      'textarea[placeholder*="skills" i]',
      // Japanese
      'input[name*="スキル"]',
      'input[name*="技能"]',
      'input[name*="能力"]',
      'textarea[name*="スキル"]',
      'input[id*="スキル"]',
      'input[placeholder*="スキル" i]',
      'textarea[placeholder*="スキル" i]',
      'input[aria-label*="スキル" i]'
    ],

    // Cover Letter / Summary
    coverLetter: [
      'textarea[name*="coverLetter"]',
      'textarea[name*="cover_letter"]',
      'textarea[name*="cover-letter"]',
      'textarea[name*="summary"]',
      'textarea[name*="message"]',
      'textarea[name*="comments"]',
      'textarea[name*="motivation"]',
      'textarea[name*="why"]',
      'textarea[name*="letter"]',
      'textarea[id*="cover-letter"]',
      'textarea[id*="coverLetter"]',
      'textarea[id*="summary"]',
      'textarea[id*="message"]',
      'textarea[placeholder*="cover letter" i]',
      'textarea[placeholder*="summary" i]',
      'textarea[placeholder*="why" i]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="motivation" i]',
      // Japanese
      'textarea[name*="志望動機"]',
      'textarea[name*="自己PR"]',
      'textarea[name*="メッセージ"]',
      'textarea[name*="コメント"]',
      'textarea[id*="志望動機"]',
      'textarea[id*="自己PR"]',
      'textarea[placeholder*="志望動機" i]',
      'textarea[placeholder*="自己PR" i]',
      'textarea[aria-label*="志望動機" i]'
    ],

    // Self Introduction (for profile pages)
    selfIntroduction: [
      'textarea[name*="bio"]',
      'textarea[name*="about"]',
      'textarea[name*="introduction"]',
      'textarea[name*="profile"]',
      'textarea[name*="description"]',
      'textarea[id*="bio"]',
      'textarea[id*="about"]',
      'textarea[id*="introduction"]',
      'textarea[placeholder*="tell us about yourself" i]',
      'textarea[placeholder*="about you" i]',
      'textarea[placeholder*="introduction" i]',
      // Japanese
      'textarea[name*="自己紹介"]',
      'textarea[name*="プロフィール"]',
      'textarea[name*="経歴"]',
      'textarea[id*="自己紹介"]',
      'textarea[placeholder*="自己紹介" i]',
      'textarea[aria-label*="自己紹介" i]'
    ]
  };

  // Site-specific selectors for major job sites
  const SITE_SPECIFIC_SELECTORS = {
    'indeed.com': {
      fullName: ['input[name="applicant.name"]', 'input[id*="name"]'],
      firstName: ['input[name="applicant.firstName"]', 'input[id*="firstName"]'],
      lastName: ['input[name="applicant.lastName"]', 'input[id*="lastName"]'],
      email: ['input[name="applicant.emailAddress"]', 'input[type="email"]'],
      phone: ['input[name="applicant.phoneNumber"]', 'input[type="tel"]'],
      address: ['input[name="applicant.address"]', 'input[name*="address"]'],
      currentTitle: ['input[name="applicant.jobTitle"]', 'input[name*="jobTitle"]'],
      currentCompany: ['input[name="applicant.company"]', 'input[name*="company"]'],
      coverLetter: ['textarea[name="applicant.coverLetter"]', 'textarea[name*="coverLetter"]'],
      skills: ['textarea[name="applicant.skills"]', 'input[name*="skills"]']
    },
    'linkedin.com': {
      fullName: ['input[name="name"]', 'input[id*="name"]'],
      email: ['input[name="email"]', 'input[type="email"]'],
      phone: ['input[name="phoneNumber"]', 'input[type="tel"]'],
      currentTitle: ['input[name="title"]', 'input[name*="title"]'],
      currentCompany: ['input[name="company"]', 'input[name*="company"]'],
      coverLetter: ['textarea[name="message"]', 'textarea[id*="message"]'],
      skills: ['input[name*="skills"]', 'textarea[name*="skills"]']
    },
    'glassdoor.com': {
      fullName: ['input[name="fullName"]', 'input[id*="name"]'],
      firstName: ['input[name="firstName"]', 'input[id*="firstName"]'],
      lastName: ['input[name="lastName"]', 'input[id*="lastName"]'],
      email: ['input[name="email"]', 'input[type="email"]'],
      phone: ['input[name="phone"]', 'input[type="tel"]'],
      currentTitle: ['input[name="currentTitle"]', 'input[name*="title"]'],
      currentCompany: ['input[name="currentCompany"]', 'input[name*="company"]'],
      coverLetter: ['textarea[name="coverLetter"]', 'textarea[name*="message"]']
    },
    'gaijinpot.com': {
      fullName: ['input[name="name"]', 'input[id="name"]'],
      firstName: ['input[name="first_name"]', 'input[id*="first_name"]'],
      lastName: ['input[name="last_name"]', 'input[id*="last_name"]'],
      email: ['input[name="email"]', 'input[id="email"]'],
      phone: ['input[name="phone"]', 'input[name="telephone"]', 'input[type="tel"]'],
      currentTitle: ['input[name*="job_title"]', 'input[name*="position"]'],
      currentCompany: ['input[name*="company"]', 'input[name*="employer"]'],
      school: ['input[name*="school"]', 'input[name*="university"]'],
      degree: ['input[name*="degree"]', 'select[name*="degree"]'],
      coverLetter: ['textarea[name="cover_letter"]', 'textarea[name="message"]'],
      skills: ['textarea[name*="skills"]', 'input[name*="skills"]']
    },
    'workday.com': {
      fullName: ['input[data-automation-id*="name"]'],
      firstName: ['input[data-automation-id*="firstName"]'],
      lastName: ['input[data-automation-id*="lastName"]'],
      email: ['input[data-automation-id*="email"]'],
      phone: ['input[data-automation-id*="phone"]'],
      currentTitle: ['input[data-automation-id*="title"]'],
      currentCompany: ['input[data-automation-id*="company"]'],
      coverLetter: ['textarea[data-automation-id*="coverLetter"]']
    },
    'greenhouse.io': {
      fullName: ['input[id*="first_name"]', 'input[id*="last_name"]'],
      firstName: ['input[id*="first_name"]'],
      lastName: ['input[id*="last_name"]'],
      email: ['input[id*="email"]'],
      phone: ['input[id*="phone"]'],
      currentTitle: ['input[id*="current_title"]'],
      currentCompany: ['input[id*="current_company"]'],
      school: ['input[id*="school"]'],
      degree: ['input[id*="degree"]'],
      coverLetter: ['textarea[id*="cover_letter"]']
    },
    'lever.co': {
      fullName: ['input[name*="name"]'],
      email: ['input[name*="email"]'],
      phone: ['input[name*="phone"]'],
      currentTitle: ['input[name*="title"]'],
      currentCompany: ['input[name*="company"]'],
      coverLetter: ['textarea[name*="comments"]']
    }
  };

  // Export to global scope for content script access
  window.FIELD_SELECTORS = FIELD_SELECTORS;
  window.SITE_SPECIFIC_SELECTORS = SITE_SPECIFIC_SELECTORS;

  console.log('📋 Selectors module loaded with', Object.keys(FIELD_SELECTORS).length, 'field types');
}
