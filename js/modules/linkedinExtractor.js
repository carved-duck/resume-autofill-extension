// LinkedIn Profile Data Extractor

// Initialize logger for reduced console output
const logger = window.logger || {
  debug: () => {}, // Silent by default
  info: (msg, data) => console.log(`ℹ️ LinkedIn: ${msg}`, data ? data : ''),
  warn: (msg, data) => console.warn(`⚠️ LinkedIn: ${msg}`, data ? data : ''),
  error: (msg, data) => console.error(`❌ LinkedIn: ${msg}`, data ? data : ''),
  success: (msg, data) => console.log(`✅ LinkedIn: ${msg}`, data ? data : '')
};

// Set debug mode - change to true for detailed logging
const DEBUG_MODE = false;
if (DEBUG_MODE) {
  logger.debug = (msg, data) => console.log(`🔍 LinkedIn: ${msg}`, data ? data : '');
}

export class LinkedInExtractor {
  constructor() {
    this.isLinkedInPage = this.checkIfLinkedInPage();
    this.expansionAttempts = 0;
    this.maxExpansionAttempts = 3;
  }

  checkIfLinkedInPage() {
    return window.location?.hostname?.includes('linkedin.com') || false;
  }

  async extractProfileData() {
    if (!this.isLinkedInPage) {
      throw new Error('Not on LinkedIn page');
    }

    logger.info('Extracting LinkedIn profile data...');

    try {
      // Step 1: Scroll to load all sections
      await this.scrollToLoadAllSections();

      // Step 2: Extract personal info (name, headline, location)
      const personalInfo = await this.extractPersonalInfo();

      // Step 3: Extract contact info (email, phone, website)
      await this.extractContactInfo(personalInfo);

      // Step 4: Extract about/summary section
      const summary = await this.extractSummary();

      // Step 5: Extract skills
      const skills = await this.extractSkills();

      // Step 6: Extract certifications
      const certifications = await this.extractCertifications();

      // Step 7: Extract experience (basic info from main page)
      const experiences = await this.extractExperienceBasic();

      // Step 8: Extract education (basic info from main page)
      const educations = await this.extractEducationBasic();

      const profileData = {
        personal_info: personalInfo || {},
        summary: summary || '',
        work_experience: Array.isArray(experiences) ? experiences : [],
        education: Array.isArray(educations) ? educations : [],
        skills: Array.isArray(skills) ? skills : [],
        projects: [],
        languages: [],
        certifications: Array.isArray(certifications) ? certifications : []
      };

      // Validate and ensure data quality
      const validatedProfileData = this.validateAndCleanProfileData(profileData);

      // Log summary of extracted data
      logger.success('LinkedIn profile data extracted successfully', {
        personal_info: Object.keys(validatedProfileData.personal_info || {}).length + ' fields',
        summary: validatedProfileData.summary?.length + ' chars' || 'none',
        work_experience: validatedProfileData.work_experience?.length + ' jobs' || 'none',
        education: validatedProfileData.education?.length + ' entries' || 'none',
        skills: validatedProfileData.skills?.length + ' skills' || 'none',
        certifications: validatedProfileData.certifications?.length + ' certs' || 'none'
      });

      return validatedProfileData;

    } catch (error) {
      logger.error('Failed to extract LinkedIn data', error);
      throw error;
    }
  }

  async extractPersonalInfo() {
    logger.debug('Extracting personal info...');

    const personalInfo = {};
    
    // Wait for page to load properly
    await this.wait(2000);

    // Name - Updated selectors based on current LinkedIn structure
    const nameSelectors = [
      "h1[data-generated-suggestion-target]",
      "h1.text-heading-xlarge", 
      "h1.top-card-layout__title",
      ".pv-text-details__left-panel h1",
      ".ph5 h1", 
      "main h1",
      ".scaffold-layout__main h1",
      "h1",
      // Generic selectors for any h1 in main content areas
      "section h1",
      "div[data-view-name='profile-card'] h1"
    ];

    for (const selector of nameSelectors) {
      let nameEl;
      try {
        // Use CSS selectors only (remove XPath to avoid issues)
        nameEl = document.querySelector(selector);
      } catch (error) {
        logger.debug(`Failed name selector: ${selector}`);
        continue;
      }

      if (nameEl && nameEl.textContent?.trim()) {
        const fullName = this.deduplicateText(nameEl.textContent?.trim() || '');
        // Validate that this looks like a name (allow international characters)
        if (fullName.length > 2 && fullName.length < 100 && 
            /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s\-.']+$/.test(fullName) && // Support international characters
            !fullName.toLowerCase().includes('linkedin') &&
            !fullName.toLowerCase().includes('profile')) {
          personalInfo.full_name = fullName;
          personalInfo.name = fullName; // Compatibility

          const nameParts = fullName.split(' ').filter(part => part.length > 0);
          if (nameParts.length >= 2) {
            personalInfo.first_name = nameParts[0];
            personalInfo.last_name = nameParts[nameParts.length - 1];
          } else if (nameParts.length === 1) {
            personalInfo.first_name = nameParts[0];
          }
          logger.debug('Found name', fullName);
          break;
        }
      }
    }

    // Headline - Updated selectors for current LinkedIn structure  
    const headlineSelectors = [
      ".text-body-medium.break-words",
      ".pv-text-details__left-panel .text-body-medium", 
      ".ph5 .text-body-medium",
      "main .text-body-medium",
      ".scaffold-layout__main .text-body-medium", 
      ".top-card-layout__headline .text-body-medium",
      "div[data-view-name='profile-card'] .text-body-medium",
      ".text-body-medium", // Broader fallback
      // Try to find headline near the name
      "h1 + div .text-body-medium",
      "h1 ~ div .text-body-medium"
    ];

    for (const selector of headlineSelectors) {
      let headlineEl;
      try {
        headlineEl = document.querySelector(selector);
      } catch (error) {
        logger.debug(`Failed headline selector: ${selector}`);
        continue;
      }

      if (headlineEl && headlineEl.textContent?.trim()) {
        const headline = this.deduplicateText(headlineEl.textContent?.trim() || '');
        // Skip if this looks like a name instead of headline or is too short/long
        if (headline.length > 5 && headline.length < 200 && 
            !headline.includes(personalInfo.full_name || '') &&
            headline !== personalInfo.full_name) {
          personalInfo.headline = headline;
          logger.debug('Found headline', headline.substring(0, 50) + '...');
          break;
        }
      }
    }

    // Location - Updated selectors
    const locationSelectors = [
      ".text-body-small.inline.t-black--light.break-words",
      ".pv-text-details__left-panel .text-body-small",
      ".ph5 .text-body-small", 
      "main .text-body-small",
      ".scaffold-layout__main .text-body-small",
      ".top-card-layout__headline .text-body-small",
      "div[data-view-name='profile-card'] .text-body-small",
      ".text-body-small", // Broader fallback
      // Try to find location near headline
      ".text-body-medium + .text-body-small",
      ".text-body-medium ~ .text-body-small"
    ];

    for (const selector of locationSelectors) {
      let locationEl;
      try {
        locationEl = document.querySelector(selector);
      } catch (error) {
        logger.debug(`Failed location selector: ${selector}`);
        continue;
      }

      if (locationEl && locationEl.textContent?.trim()) {
        const location = this.deduplicateText(locationEl.textContent?.trim() || '');
        // Enhanced validation for location
        if (location.length > 2 && location.length < 100 && 
            !location.includes('@') && !location.includes('http') &&
            location !== personalInfo.full_name && location !== personalInfo.headline &&
            // Check if it looks like a location (contains common location words or patterns)
            (/\b(city|state|country|,|\s-\s)/i.test(location) || location.split(' ').length <= 4)) {
          personalInfo.location = location;
          logger.debug('Found location', location);
          break;
        }
      }
    }

    // LinkedIn URL
    personalInfo.linkedin = window.location?.href?.split('?')[0] || '';

    logger.debug('Personal info extraction completed');
    return personalInfo;
  }

  async extractContactInfo(personalInfo) {
    logger.debug('Extracting contact info...');

    if (!personalInfo) {
      logger.warn('No personalInfo object provided, creating new one');
      personalInfo = {};
    }

    try {
      // Look for contact info trigger (now an <a> link, not a button)
      const contactSelectors = [
        'a#top-card-text-details-contact-info',
        'a[href*="overlay/contact-info"]',
        'a.link-without-visited-state',
        'a[data-control-name="contact_see_more"]',
        '.pv-top-card__contact-info',
        '.contact-info'
      ];

      let contactLink = null;
      for (const selector of contactSelectors) {
        contactLink = document.querySelector(selector);
        if (contactLink) {
          logger.debug('Found contact info link');
          break;
        }
      }

      if (contactLink) {
        // Click the contact info link
        try {
          contactLink.click();
          await this.wait(500);
        } catch (error) {
          console.warn('⚠️ Failed to click contact link:', error);
          return;
        }

        // Wait for the modal to appear and be visible
        let modal = null;
        for (let i = 0; i < 10; i++) { // up to 2s
          modal = document.querySelector('.artdeco-modal[role="dialog"]');
          if (modal && modal.offsetParent !== null) break;
          await this.wait(200);
        }
        if (!modal || modal.offsetParent === null) {
          logger.warn('Contact info modal not found or not visible.');
          return personalInfo; // Return the object instead of undefined
        }

        // Wait for modal content (email or website link) to appear
        let modalContent = null;
        for (let i = 0; i < 10; i++) { // up to 2s
          modalContent = modal.querySelector('section, .pv-contact-info__contact-type, .artdeco-modal__content');
          if (modalContent && (modalContent.querySelector('a[href^="mailto:"]') || modalContent.querySelector('a[href^="http"]:not([href*="linkedin"])'))) break;
          await this.wait(200);
        }
        if (!modalContent) modalContent = modal;

        // Extract email
        let foundEmail = false;
        const emailElement = modalContent.querySelector('a[href^="mailto:"]');
        if (emailElement && emailElement.href) {
          const email = emailElement.href.replace('mailto:', '');
          personalInfo.email = email;
          foundEmail = true;
          logger.debug('Found email', email);
        }
        if (!foundEmail) {
          logger.debug('Email not found in modal');
        }

        // Extract website
        let foundWebsite = false;
        // Prefer .ci-websites a, but fallback to any http link not linkedin
        let websiteElement = modalContent.querySelector('.ci-websites a');
        if (!websiteElement) {
          websiteElement = modalContent.querySelector('a[href^="http"]:not([href*="linkedin"])');
        }
        if (websiteElement && websiteElement.href) {
          const website = websiteElement.href;
          personalInfo.website = website;
          foundWebsite = true;
          logger.debug('Found website', website);
        }
        if (!foundWebsite) {
          logger.debug('Website not found in modal');
        }

        // Extract phone (if present)
        let foundPhone = false;
        const phoneElement = modalContent.querySelector('span[aria-label*="phone"], .ci-phone, .contact-info .ci-phone, .pv-contact-info__contact-type.ci-phone span.t-14');
        if (phoneElement && phoneElement.textContent?.trim()) {
          const phone = phoneElement.textContent?.trim() || '';
          personalInfo.phone = phone;
          foundPhone = true;
          logger.debug('Found phone', phone);
        }
        if (!foundPhone) {
          logger.debug('Phone not found in modal');
        }

        // Close contact info modal if open
        const closeButton = modal.querySelector('button[aria-label*="Dismiss"], .artdeco-modal__dismiss');
        if (closeButton) {
          try {
            closeButton.click();
            await this.wait(500);
          } catch (error) {
            console.warn('⚠️ Failed to close contact modal:', error);
          }
        }
      } else {
        logger.warn('Contact info link not found');
      }

    } catch (error) {
      console.error('❌ Failed to extract contact info:', error);
    }
    
    return personalInfo; // Always return the personalInfo object
  }

  async extractSummary() {
    logger.debug('Extracting summary/about...');

    try {
      // First, look for the About section
      const aboutSection = document.querySelector('#about');
      if (!aboutSection) {
        logger.debug('About section not found');
        return '';
      }

      logger.debug('About section found, scrolling to it...');
      
      // Scroll to the about section to ensure it's loaded
      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(2000); // Increased wait time

      // Look for the content in the next sibling or within a container
      const aboutSelectors = [
        // Modern LinkedIn selectors
        '#about + div .pv-shared-text-with-see-more',
        '#about ~ div .pv-shared-text-with-see-more', 
        '#about + section .pv-shared-text-with-see-more',
        '#about ~ section .pv-shared-text-with-see-more',
        // Fallback selectors
        '#about + div .pvs-list__outer-container',
        '#about ~ div .pvs-list__outer-container',
        // Direct siblings
        '#about + div',
        '#about ~ div',
        '#about + section', 
        '#about ~ section',
        // Look for common about content patterns
        'section[data-section="summary"]',
        'section[data-section="about"]',
        '.pv-about-section',
        '[data-view-name="profile-summary"]'
      ];

      for (const selector of aboutSelectors) {
        const aboutContent = document.querySelector(selector);
        if (aboutContent) {
          logger.debug('Found about content');
          logger.debug('About content preview', aboutContent.innerHTML.substring(0, 100) + '...');
          
          // Skip if this looks like a header container (has h2 but minimal text)
          const hasHeader = aboutContent.querySelector('h2, h3, h4');
          const textContent = aboutContent.textContent?.trim() || '';
          if (hasHeader && textContent.length < 100) {
            logger.debug('Skipping header container, looking for actual content...');
            continue;
          }
          
          // Click "see more" if present
          const seeMoreButton = aboutContent.querySelector('button[aria-label*="see more"], .inline-show-more-text__button, button[aria-expanded="false"]');
          if (seeMoreButton) {
            try {
              logger.debug('Found see more button, clicking...');
              seeMoreButton.click();
              await this.wait(500);
              console.log('✅ Expanded about section');
            } catch (e) {
              console.log('⚠️ Could not expand about section:', e.message);
            }
          }

          // Extract text content with multiple strategies
          const textSelectors = [
            'span[aria-hidden="true"]',
            '.inline-show-more-text span',
            '.pv-about__summary-text',
            '.pv-shared-text-with-see-more span',
            '.pvs-list__outer-container span',
            'p',
            'div'
          ];

          for (const textSelector of textSelectors) {
            const textElement = aboutContent.querySelector(textSelector);
            if (textElement) {
              const summaryText = textElement.textContent?.trim() || '';
              if (summaryText && summaryText.length > 50) { // Reduced length requirement
                console.log(`✅ Found summary with ${textSelector}: ${summaryText.substring(0, 100)}...`);
                return summaryText;
              }
            }
          }

          // If no text found in nested elements, try the content directly
          const directText = aboutContent.textContent?.trim() || '';
          if (directText && directText.length > 50) { // Reduced length requirement
            console.log(`✅ Found summary (direct): ${directText.substring(0, 100)}...`);
            return directText;
          }
        }
      }

      // Alternative approach: Look for all divs after About and find the one with substantial text
      console.log('🔍 Trying alternative approach - looking for content-rich divs after About...');
      const aboutEl = document.querySelector('#about');
      if (aboutEl) {
        let currentElement = aboutEl.nextElementSibling;
        let attempts = 0;
        
        while (currentElement && attempts < 10) {
          const textContent = currentElement.textContent?.trim() || '';
          if (textContent.length > 50) {
            // Clean up the text by removing "see more" and extra whitespace
            const cleanedText = textContent
              .replace(/\s*…?\.?\s*see\s+more\s*/gi, '')
              .replace(/\s*\.\.\.\s*see\s+more\s*/gi, '')
              .replace(/\s*show\s+more\s*/gi, '')
              .replace(/\s+/g, ' ')
              .trim();
            
            console.log(`✅ Found substantial content in element ${attempts + 1}: ${cleanedText.substring(0, 100)}...`);
            return cleanedText;
          }
          currentElement = currentElement.nextElementSibling;
          attempts++;
        }
      }

      console.log('⚠️ No summary found after trying all selectors');
      return '';

    } catch (error) {
      console.error('❌ Failed to extract summary:', error);
      return '';
    }
  }

  async extractSkills() {
    logger.debug('Extracting skills...');

    const skills = [];

    try {
      // Look for skills section
      const skillsSection = document.querySelector('#skills');
      if (!skillsSection) {
        logger.debug('Skills section not found');
        return skills;
      }

      // Scroll to skills section
      skillsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(1500);

      // Look for "Show all X skills" button - more comprehensive search
      const skillsExpandButtons = [
        'button[aria-label*="Show all"][aria-label*="skill"]',
        'button[aria-label*="skills"][aria-label*="Show"]',
        '#skills ~ * button[aria-label*="Show"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button',
        'button[data-control-name="skill_details"]',
        'a[href*="skills"]'
      ];

      let foundExpandButton = false;
      for (const selector of skillsExpandButtons) {
        try {
          // Search in skills section and its siblings
          const expandButton = document.querySelector(selector);

          if (expandButton && expandButton.offsetParent !== null) {
            logger.debug('Found skills expand button');
            try {
              expandButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await this.wait(500);
              expandButton.click();
              await this.wait(3000); // Longer wait for skills to load
              foundExpandButton = true;
              break;
            } catch (clickError) {
              console.warn(`⚠️ Failed to click skills expand button: ${clickError.message}`);
            }
          }
        } catch (e) {
          logger.debug(`Failed to expand skills: ${selector}`);
        }
      }

      if (!foundExpandButton) {
        logger.debug('No skills expand button found, proceeding with visible skills');
      }

      // Multiple strategies for extracting skills
      const skillSelectors = [
        // Modern LinkedIn skills selectors
        '#skills ~ div .pvs-list__item--line-separated .pvs-entity__path-node',
        '#skills ~ * .pvs-entity__path-node',
        '.pvs-list__item--line-separated .pvs-entity__path-node',
        '.skills-section .pvs-entity__path-node', 
        // Broader selectors
        '.pvs-entity__path-node', // All path nodes
        '.skill-item span',
        'a[data-field="skill_page_skill_topic"]',
        // Text-based fallback
        '#skills ~ div span[aria-hidden="true"]'
      ];

      const extractedSkills = new Set(); // Use Set to avoid duplicates

      for (const selector of skillSelectors) {
        const skillElements = document.querySelectorAll(selector);
        
        if (skillElements.length > 0) {
          logger.debug(`Found ${skillElements.length} skill elements`);
          
          // Limit to avoid processing too many elements
          const elementsToProcess = Math.min(skillElements.length, 50);
          
          for (let i = 0; i < elementsToProcess; i++) {
            const skillEl = skillElements[i];
            if (skillEl && skillEl.textContent?.trim()) {
              const skillText = skillEl.textContent?.trim() || '';
              
              // Validate skill text
              if (this.isValidSkill(skillText)) {
                extractedSkills.add(skillText);
                logger.debug('Found skill', skillText);
              }
            }
          }
          
          // If we found skills with this selector, log and continue to get more
          if (extractedSkills.size > 0) {
            logger.debug(`Extracted ${extractedSkills.size} skills so far`);
          }
        }
      }

      // Convert Set back to Array
      skills.push(...Array.from(extractedSkills));

      logger.info(`Extracted ${skills.length} skills`);

    } catch (error) {
      console.error('❌ Failed to extract skills:', error);
    }

    return skills;
  }

  isValidSkill(skillText) {
    if (!skillText || skillText.length < 2 || skillText.length > 80) return false;
    
    const lowerSkill = skillText.toLowerCase();
    
    // Skip common non-skill patterns
    if (lowerSkill.includes('show all') ||
        lowerSkill.includes('skills') ||
        lowerSkill.includes('endorsed') ||
        lowerSkill.includes('connection') ||
        lowerSkill.includes('mutual') ||
        lowerSkill.includes('people') ||
        lowerSkill.match(/^\d+$/) || // Just numbers
        lowerSkill.match(/\d{4}/) || // Years
        lowerSkill.includes('experience') ||
        lowerSkill.includes('see more')) {
      return false;
    }

    return true;
  }

  async extractCertifications() {
    logger.debug('Extracting certifications...');

    const certifications = [];

    try {
      // Look for certifications section
      const certSection = document.querySelector('#licenses_and_certifications, .certifications-section');
      if (!certSection) {
        console.log('⚠️ Certifications section not found');
        return certifications;
      }

      // Scroll to certifications section
      certSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(1000);

      // Look for "Show all" button
      const expandButtons = [
        'button[aria-label*="Show all"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button'
      ];

      for (const selector of expandButtons) {
        try {
          const expandButton = certSection.querySelector(selector);
          if (expandButton && expandButton.offsetParent !== null) {
            console.log(`🎯 Found certifications expand button: ${selector}`);
            try {
              expandButton.click();
              await this.wait(2000);
              break;
            } catch (clickError) {
              console.warn(`⚠️ Failed to click certifications expand button: ${clickError.message}`);
            }
          }
        } catch (e) {
          console.log(`⚠️ Failed to expand certifications with selector ${selector}:`, e.message);
        }
      }

      // Extract certifications
      const certElements = certSection.querySelectorAll('.pvs-list__item--line-separated, .pvs-entity');

      for (const cert of certElements) {
        try {
          const nameElement = cert.querySelector('.pvs-entity__path-node, .certification-item__name');
          const issuerElement = cert.querySelector('.pvs-entity__path-node + span, .certification-item__issuer');

          if (nameElement) {
            const certData = {
              name: nameElement.textContent?.trim() || '',
              issuer: issuerElement ? (issuerElement.textContent?.trim() || '') : null
            };

            if (certData.name && certData.name.length > 2) {
              certifications.push(certData);
            }
          }
        } catch (e) {
          console.log(`⚠️ Failed to parse certification:`, e.message);
        }
      }

      console.log(`✅ Extracted ${certifications.length} certifications`);

    } catch (error) {
      console.error('❌ Failed to extract certifications:', error);
    }

    return certifications;
  }

  async extractExperienceBasic() {
    logger.debug('Extracting experience from LinkedIn profile...');

    const experiences = [];

    try {
      // Find the experience section
      const expSection = document.querySelector('#experience');
      if (!expSection) {
        console.log('⚠️ Experience section not found');
        return experiences;
      }

      console.log('✅ Found experience section, scrolling to it...');
      expSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(2000); // Give more time to load

      // Try structured extraction first
      const structuredExperiences = await this.extractStructuredExperience();
      if (structuredExperiences.length > 0) {
        console.log(`✅ Found ${structuredExperiences.length} structured experiences`);
        return structuredExperiences;
      }

      // Fallback to text parsing approach
      console.log('⚠️ Falling back to text parsing approach...');
      
      // Get all text from the experience section and analyze it
      const experienceText = expSection.textContent || '';
      console.log(`📍 Experience section text (first 300 chars): ${experienceText.substring(0, 300)}...`);
      
      // Split into meaningful lines with better filtering
      const lines = experienceText
        .split('\n')
        .map(line => this.deduplicateText(line.trim()))
        .filter(line => line.length > 2 && line.length < 150)
        .filter(line => {
          const lowerLine = line.toLowerCase();
          return !lowerLine.includes('experience') && // Skip section header
                 !lowerLine.includes('show all') && // Skip "Show all" buttons
                 !lowerLine.includes('show ') && // Skip "Show" buttons
                 !lowerLine.includes('view ') && // Skip "View" links
                 !lowerLine.includes('ago') && // Skip "2 months ago" type text
                 !lowerLine.includes('connection') && // Skip connection text
                 !lowerLine.includes('mutual') && // Skip mutual connections
                 !lowerLine.includes('people you may know') && // Skip suggestions
                 !lowerLine.includes('message') && // Skip message buttons
                 !lowerLine.includes('follow') && // Skip follow buttons
                 !line.match(/^\d+$/) && // Skip standalone numbers
                 !lowerLine.includes(' yrs') && // Skip "2 yrs" type text
                 !lowerLine.includes(' mos') && // Skip "6 mos" type text
                 // REMOVED: !lowerLine.includes('· ') && // We need metadata lines for company extraction!
                 !lowerLine.match(/^(full-time|part-time|contract|freelance)$/); // Skip employment types
        });

      console.log(`📍 Filtered lines: ${lines.slice(0, 10).join(' | ')}`);

      // Two-pass parsing approach: collect potential titles and companies, then match them
      console.log('🔍 Starting two-pass parsing approach...');
      
      const potentialTitles = [];
      const potentialCompanies = [];
      const dateRanges = [];
      
      // Pass 1: Collect all potential titles, companies, and date ranges
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`🔍 Processing line ${i}: "${line}"`);
        
        if (this.looksLikeDateRange(line)) {
          dateRanges.push({ text: line, index: i });
          console.log(`📅 Found date range: "${line}"`);
          continue;
        }
        
        // Skip very short lines
        if (line.length < 3) {
          console.log(`⏭️ Skipping line ${i}: too short`);
          continue;
        }
        
        // Check if this line looks like metadata (contains bullet point)
        if (this.looksLikeMetadata(line)) {
          console.log(`🔍 Checking metadata line: "${line}"`);
          const extractedCompany = this.extractCompanyFromMetadata(line);
          if (extractedCompany) {
            potentialCompanies.push({ text: extractedCompany, index: i, source: 'metadata' });
            console.log(`🏢 Added company from metadata: "${extractedCompany}"`);
          }
          continue;
        }
        
        // Check if it's a valid job title
        if (this.isValidJobTitle(line)) {
          potentialTitles.push({ text: line, index: i });
          console.log(`💼 Added potential title: "${line}"`);
        }
        
        // Check if it's a valid company name
        if (this.isValidCompanyName(line)) {
          potentialCompanies.push({ text: line, index: i, source: 'direct' });
          console.log(`🏢 Added potential company: "${line}"`);
        }
      }
      
      logger.debug(`Collection results: ${potentialTitles.length} titles, ${potentialCompanies.length} companies, ${dateRanges.length} dates`);
      
      // Pass 2: Match titles with companies based on proximity
      for (const title of potentialTitles) {
        console.log(`🔗 Looking for company match for title: "${title.text}"`);
        
        // Find the closest company to this title
        let closestCompany = null;
        let smallestDistance = Infinity;
        
        for (const company of potentialCompanies) {
          const distance = Math.abs(company.index - title.index);
          console.log(`   - Company "${company.text}" at distance ${distance} (source: ${company.source})`);
          
          if (distance < smallestDistance && distance <= 5) { // Only consider companies within 5 lines
            smallestDistance = distance;
            closestCompany = company;
          }
        }
        
        if (closestCompany) {
          // Find the closest date range
          let closestDate = '';
          let smallestDateDistance = Infinity;
          
          for (const dateRange of dateRanges) {
            const distance = Math.abs(dateRange.index - title.index);
            if (distance < smallestDateDistance && distance <= 3) {
              smallestDateDistance = distance;
              closestDate = dateRange.text;
            }
          }
          
          const experience = {
            title: title.text,
            company: closestCompany.text,
            date_range: closestDate,
            location: '',
            description: `${title.text} at ${closestCompany.text}`
          };
          
          experiences.push(experience);
          console.log(`✅ Matched experience: "${title.text}" at "${closestCompany.text}" (${closestDate}) [${closestCompany.source}]`);
          
          // Remove used company to avoid duplicates
          const companyIndex = potentialCompanies.indexOf(closestCompany);
          if (companyIndex > -1) {
            potentialCompanies.splice(companyIndex, 1);
          }
        } else {
          console.log(`❌ No company found for title: "${title.text}"`);
        }
      }
      
      // Remove duplicates based on title + company combination
      const uniqueExperiences = experiences.filter((exp, index, self) => 
        index === self.findIndex(e => e.title === exp.title && e.company === exp.company)
      );
      
      console.log(`✅ Extracted ${uniqueExperiences.length} unique experiences`);
      return uniqueExperiences;
      
    } catch (error) {
      console.error('❌ Failed to extract experience:', error);
      return experiences;
    }
  }

  async extractStructuredExperience() {
    logger.debug('Attempting structured experience extraction...');

    const experiences = [];

    try {
      // First, look for any "Show all X experiences" button and click it
      await this.clickShowAllExperiences();

      // Updated selectors for current LinkedIn structure
      const experienceSelectors = [
        // Modern LinkedIn experience selectors
        '#experience ~ div .pvs-list__item--line-separated',
        '#experience ~ * .pvs-list__item--line-separated', 
        '.pvs-list__item--line-separated', // Broader search
        '.pvs-entity__path-node', // Individual experience entries
        '.artdeco-entity-lockup', // Experience cards
        '.experience-item', // Legacy
        '[data-view-name="profile-component-entity"]', // Experience entities
        '.profile-section-card', // Section cards
        // Try looking in the experience section's parent
        '#experience + div li',
        '#experience ~ div li',
        // Very broad selectors as fallback
        'li[data-field*="experience"]',
        'div[data-section*="experience"]'
      ];

      for (const selector of experienceSelectors) {
        const expElements = document.querySelectorAll(selector);
        
        if (expElements.length > 0) {
          console.log(`✅ Found ${expElements.length} experience elements with selector: ${selector}`);
          
          for (const expEl of expElements) {
            try {
              // Check if this element contains multiple positions under one company
              const nestedPositions = await this.extractNestedPositions(expEl);
              
              if (nestedPositions && nestedPositions.length > 1) {
                // Found multiple positions under one company
                experiences.push(...nestedPositions);
                console.log(`✅ Extracted ${nestedPositions.length} nested positions under company: "${nestedPositions[0].company}"`);
              } else {
                // Try regular single experience extraction
                const extractedExp = await this.extractExperienceFromElement(expEl);
                if (extractedExp) {
                  experiences.push(extractedExp);
                  console.log(`✅ Structured extraction: "${extractedExp.title}" at "${extractedExp.company}"`);
                }
              }
            } catch (e) {
              console.log('⚠️ Failed to parse experience element:', e.message);
            }
          }
          
          if (experiences.length > 0) {
            console.log(`✅ Successfully extracted ${experiences.length} experiences with selector: ${selector}`);
            break; // Use the first successful selector
          }
        }
      }

    } catch (error) {
      console.error('❌ Structured experience extraction failed:', error);
    }

    return experiences;
  }

  isValidJobTitle(title) {
    if (!title || title.length < 3 || title.length > 100) return false;
    
    const lowerTitle = title.toLowerCase();
    
    // Skip common non-title patterns
    if (lowerTitle.match(/^\d{4}/) || // Starts with year
        lowerTitle.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/) || // Contains month
        lowerTitle.includes('·') || // Contains metadata bullet
        lowerTitle.includes('full-time') ||
        lowerTitle.includes('part-time') ||
        lowerTitle.includes('contract') ||
        lowerTitle.includes('permanent') ||
        lowerTitle.includes('yrs') ||
        lowerTitle.includes('mos') ||
        lowerTitle.includes('ago') ||
        this.looksLikeMetadata(title)) {
      return false;
    }

    // Explicitly exclude known company patterns that shouldn't be job titles
    const companyPatterns = [
      'inc', 'llc', 'corp', 'corporation', 'company', 'ltd', 'limited',
      'suites', 'hotel', 'resort', 'casino', 'spa', 'inn', 'lodge', 'plaza',
      'bank', 'group', 'holdings', 'enterprises', 'solutions', 'services',
      'technologies', 'consulting', 'agency', 'firm', 'studio', 'studios'
    ];
    
    const hasCompanyPattern = companyPatterns.some(pattern => lowerTitle.includes(pattern));
    if (hasCompanyPattern) {
      return false; // This looks like a company name, not a job title
    }

    // Job titles typically contain certain words or patterns
    const jobTitleIndicators = [
      'engineer', 'developer', 'manager', 'director', 'analyst', 'designer',
      'consultant', 'specialist', 'coordinator', 'assistant', 'associate',
      'lead', 'senior', 'junior', 'intern', 'teacher', 'instructor', 'professor',
      'chef', 'cook', 'server', 'barista', 'receptionist', 'clerk', 'sales',
      'marketing', 'hr', 'human resources', 'operations', 'finance', 'accounting',
      'agent', 'representative', 'supervisor', 'administrator', 'technician',
      'operator', 'executive', 'officer', 'head', 'vice', 'president'
    ];
    
    // If it contains job-like words, it's likely a title
    const hasJobWords = jobTitleIndicators.some(word => 
      lowerTitle.includes(word + ' ') || 
      lowerTitle.includes(' ' + word) || 
      lowerTitle.endsWith(' ' + word) || 
      lowerTitle.startsWith(word + ' ') ||
      lowerTitle === word
    );
    
    // Check for common job title patterns
    const hasJobTitlePattern = 
      lowerTitle.includes('coordinator') ||
      lowerTitle.includes('specialist') ||
      lowerTitle.includes('manager') ||
      lowerTitle.includes('director') ||
      lowerTitle.includes('analyst') ||
      lowerTitle.includes('consultant') ||
      lowerTitle.includes('engineer') ||
      lowerTitle.includes('developer') ||
      lowerTitle.includes('teacher') ||
      lowerTitle.includes('instructor') ||
      lowerTitle.includes('professor') ||
      lowerTitle.includes('agent') ||
      lowerTitle.includes('representative') ||
      lowerTitle.includes('assistant') ||
      lowerTitle.includes('associate') ||
      lowerTitle.includes('clerk') ||
      lowerTitle.includes('supervisor');
    
    return hasJobWords || hasJobTitlePattern;
  }

  isValidCompanyName(company) {
    console.log(`🔍 DEBUG: Validating company name: "${company}"`);
    
    if (!company || company.length < 2 || company.length > 100) {
      console.log(`❌ DEBUG: Failed length check: length=${company?.length}`);
      return false;
    }
    
    const lowerCompany = company.toLowerCase();
    
    // Skip common non-company patterns
    const checks = [
      { test: lowerCompany.match(/^\d{4}/), name: 'starts with year' },
      { test: lowerCompany.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/), name: 'contains month' },
      { test: lowerCompany.includes('full-time'), name: 'contains full-time' },
      { test: lowerCompany.includes('part-time'), name: 'contains part-time' },
      { test: lowerCompany.includes('contract'), name: 'contains contract' },
      { test: lowerCompany.includes('permanent'), name: 'contains permanent' },
      { test: lowerCompany.includes('yrs'), name: 'contains yrs' },
      { test: lowerCompany.includes('mos'), name: 'contains mos' },
      { test: lowerCompany.includes('ago'), name: 'contains ago' },
      { test: lowerCompany.includes('·'), name: 'contains bullet point' },
      { test: this.looksLikeMetadata(company), name: 'looks like metadata' }
    ];
    
    for (const check of checks) {
      if (check.test) {
        console.log(`❌ DEBUG: Failed validation - ${check.name}: "${company}"`);
        return false;
      }
    }
    
    console.log(`✅ DEBUG: Passed initial checks for: "${company}"`);

    // Skip obvious job titles being mistaken for companies
    const jobTitleWords = [
      'engineer', 'developer', 'manager', 'director', 'analyst', 'designer',
      'consultant', 'specialist', 'coordinator', 'assistant', 'associate',
      'lead', 'senior', 'junior', 'intern', 'teacher', 'instructor', 'professor',
      'chef', 'cook', 'server', 'barista', 'receptionist', 'clerk', 'agent',
      'representative', 'supervisor', 'administrator', 'technician', 'operator'
    ];
    
    // If it's clearly a job title, it's not a company
    const isJobTitle = jobTitleWords.some(word => 
      lowerCompany.includes(word + ' ') || 
      lowerCompany.includes(' ' + word) || 
      lowerCompany.endsWith(' ' + word) || 
      lowerCompany.startsWith(word + ' ') ||
      lowerCompany === word
    );
    if (isJobTitle) {
      return false;
    }

    // Company indicators (positive signals) - expanded list
    const companyIndicators = [
      'inc', 'llc', 'corp', 'corporation', 'company', 'ltd', 'limited',
      'group', 'holdings', 'enterprises', 'solutions', 'services', 'systems',
      'technologies', 'tech', 'consulting', 'partners', 'associates', 
      'studios', 'studio', 'agency', 'firm', 'bank', 'hotel', 'restaurant',
      'school', 'university', 'college', 'hospital', 'clinic', 'center',
      'suites', 'resort', 'casino', 'spa', 'inn', 'lodge', 'plaza',
      'international', 'global', 'worldwide', 'industries', 'manufacturing'
    ];
    
    const hasCompanyWords = companyIndicators.some(word => lowerCompany.includes(word));
    
    // If it has company indicators, it's likely a company
    if (hasCompanyWords) {
      return true;
    }
    
    // Check if it's a known company name pattern (2+ words, proper case)
    const words = company.trim().split(/\s+/);
    const hasProperCapitalization = words.every(word => /^[A-Z]/.test(word));
    
    // If it's a proper noun (capitalized) and doesn't look like a job title, it might be a company
    const looksLikeCompany = hasProperCapitalization && 
                            words.length >= 1 && // Allow single word companies
                            !this.isObviousJobTitle(company);
    
    return looksLikeCompany;
  }

  isObviousJobTitle(text) {
    const lowerText = text.toLowerCase();
    
    // Common job title patterns
    return lowerText.includes('teacher') ||
           lowerText.includes('developer') ||
           lowerText.includes('engineer') ||
           lowerText.includes('manager') ||
           lowerText.includes('analyst') ||
           lowerText.includes('designer') ||
           lowerText.includes('consultant') ||
           lowerText.includes('specialist') ||
           lowerText.includes('director') ||
           lowerText.includes('coordinator') ||
           lowerText.includes('assistant') ||
           lowerText.includes('associate') ||
           lowerText.match(/^(senior|junior|lead|principal|chief|head of)/);
  }

  looksLikeDateRange(text) {
    if (!text || text.length < 4 || text.length > 50) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for date patterns
    return lowerText.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/) ||
           lowerText.match(/\d{4}/) ||
           lowerText.includes('present') ||
           lowerText.includes('current') ||
           lowerText.includes('yrs') ||
           lowerText.includes('mos') ||
           lowerText.includes(' - ');
  }

  looksLikeMetadata(text) {
    if (!text || text.length < 2) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for common LinkedIn metadata patterns
    return lowerText.includes('full-time') ||
           lowerText.includes('part-time') ||
           lowerText.includes('contract') ||
           lowerText.includes('freelance') ||
           lowerText.includes('remote') ||
           lowerText.includes('on-site') ||
           lowerText.includes('hybrid') ||
           lowerText.includes('·') ||
           lowerText.includes('show more') ||
           lowerText.includes('see more') ||
           lowerText.match(/^\d+\s+(yr|mo|year|month)/) || // "2 yrs", "6 months"
           lowerText.includes('skills:') ||
           lowerText.includes('endorsed');
  }

  looksLikeJobDescription(text) {
    if (!text || text.length < 20) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for common job description starting patterns
    const descriptionPatterns = [
      /^(created|managed|developed|implemented|led|responsible|achieved|conducted|provided|gained|filled|served|coordinated|responded|instructed|taught|trained|played)/i,
      /\b(reports?|duties|responsibilities|tasks?|projects?|students?|guests?|customers?|clients?)\b/i,
      /\b(Excel|Word|spreadsheets?|departments?|payroll|accounting|reservations?|hotel|marketing|enrollment)\b/i,
      /\b(successfully|effectively|efficiently|approximately|various|diverse|key role|launch)\b/i
    ];
    
    // If text is very long (like a paragraph) it's likely a description
    if (text.length > 100) {
      return descriptionPatterns.some(pattern => pattern.test(text));
    }
    
    // For shorter text, require stronger indicators
    return /^(created|managed|developed|implemented|led|responsible|achieved|conducted|provided|gained|filled|served|coordinated|responded|instructed|taught|trained|played)/i.test(text);
  }

  tryAlternativeTextPatterns(lines, result) {
    // Try to find patterns like "Title at Company" or "Title | Company"
    for (const line of lines) {
      const dedupLine = this.deduplicateText(line);
      
      if (dedupLine.includes(' at ')) {
        const parts = dedupLine.split(' at ');
        if (parts.length === 2) {
          const potentialTitle = this.deduplicateText(parts[0].trim());
          const potentialCompany = this.deduplicateText(parts[1].trim());
          
          if (this.isValidJobTitle(potentialTitle) && this.isValidCompanyName(potentialCompany)) {
            result.title = potentialTitle;
            result.company = potentialCompany;
            console.log(`✅ Found "at" pattern: "${potentialTitle}" at "${potentialCompany}"`);
            return result;
          }
        }
      }
      
      if (dedupLine.includes(' | ')) {
        const parts = dedupLine.split(' | ');
        if (parts.length === 2) {
          const potentialTitle = this.deduplicateText(parts[0].trim());
          const potentialCompany = this.deduplicateText(parts[1].trim());
          
          if (this.isValidJobTitle(potentialTitle) && this.isValidCompanyName(potentialCompany)) {
            result.title = potentialTitle;
            result.company = potentialCompany;
            console.log(`✅ Found "|" pattern: "${potentialTitle}" | "${potentialCompany}"`);
            return result;
          }
        }
      }
    }
    
    return result;
  }

  async clickShowAllExperiences() {
    logger.debug('Looking for show all experiences button...');
    
    try {
      const showAllSelectors = [
        'button[aria-label*="Show all"][aria-label*="experience"]',
        'button[aria-label*="experiences"][aria-label*="Show"]', 
        'a[href*="experience"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button',
        '#experience ~ * button[aria-label*="Show"]',
        'button[data-control-name*="experience"]'
      ];

      for (const selector of showAllSelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          logger.debug('Found show all button');
          try {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);
            
            // Check if this is a link that will navigate to a new page
            const isLink = button.tagName === 'A' && button.href;
            const willNavigate = isLink && button.href.includes('/detail/');
            
            if (willNavigate) {
              console.log('🔄 Experience button will navigate to detailed page');
              // Store current page info before navigation
              const currentUrl = window.location.href;
              const currentPageData = this.getBasicExperienceData();
              
              // Navigate to detailed experience page
              button.click();
              await this.wait(3000); // Wait for page navigation
              
              // Check if we're on the detailed experience page
              if (window.location.href !== currentUrl && 
                  window.location.href.includes('/detail/experience')) {
                logger.debug('Successfully navigated to detailed experience page');
                return await this.handleExperienceDetailPage(currentPageData);
              } else {
                logger.debug('Navigation failed, staying on current page');
                return true;
              }
            } else {
              // Standard button click (expands content on same page)
              button.click();
              await this.wait(2000); // Wait for content to load
              logger.debug('Clicked show all experiences button (expanded content)');
              return true;
            }
          } catch (clickError) {
            console.log(`⚠️ Failed to click button with selector ${selector}:`, clickError.message);
            // Continue to next selector
          }
        }
      }
      
      logger.debug('No show all experiences button found');
      return false;
    } catch (error) {
      console.error('❌ Failed to click show all experiences:', error);
      return false;
    }
  }

  // Helper method to get basic experience data before navigation
  getBasicExperienceData() {
    logger.debug('Collecting basic experience data before navigation...');
    
    const basicData = {
      profileUrl: window.location.href,
      experiences: []
    };
    
    try {
      // Get any visible experience data from the main profile page
      const expSection = document.querySelector('#experience');
      if (expSection) {
        const visibleExperiences = expSection.querySelectorAll('.pvs-list__item--line-separated');
        
        for (const exp of visibleExperiences) {
          const titleEl = exp.querySelector('.pvs-entity__path-node');
          const title = titleEl ? titleEl.textContent?.trim() : '';
          
          if (title && title.length > 2) {
            basicData.experiences.push({
              title: title,
              source: 'main_profile'
            });
          }
        }
      }
      
      logger.debug(`Collected ${basicData.experiences.length} basic experience entries`);
    } catch (error) {
      console.error('❌ Failed to collect basic experience data:', error);
    }
    
    return basicData;
  }

  // Handle extraction from detailed experience page
  async handleExperienceDetailPage(basicData) {
    logger.debug('Extracting detailed experience data from dedicated page...');
    
    try {
      // Wait for the detailed page to fully load
      await this.wait(3000);
      
      // Look for detailed experience entries on the dedicated page
      const detailSelectors = [
        '.pvs-list__item--with-top-padding',
        '.pvs-list__item--line-separated',
        '.experience-item',
        '.pvs-entity'
      ];
      
      const detailedExperiences = [];
      
      for (const selector of detailSelectors) {
        const expElements = document.querySelectorAll(selector);
        
        if (expElements.length > 0) {
          logger.debug(`Found ${expElements.length} detailed experience elements`);
          
          for (const expEl of expElements) {
            try {
              // Check if this element contains multiple positions under one company
              const nestedPositions = await this.extractNestedPositions(expEl);
              
              if (nestedPositions && nestedPositions.length > 1) {
                // Found multiple positions under one company
                nestedPositions.forEach(pos => pos.source = 'detail_page');
                detailedExperiences.push(...nestedPositions);
                console.log(`✅ Detailed extraction of ${nestedPositions.length} nested positions under: "${nestedPositions[0].company}"`);
              } else {
                // Try regular single experience extraction
                const extractedExp = await this.extractExperienceFromElement(expEl);
                if (extractedExp) {
                  extractedExp.source = 'detail_page';
                  detailedExperiences.push(extractedExp);
                  console.log(`✅ Detailed extraction: "${extractedExp.title}" at "${extractedExp.company}"`);
                }
              }
            } catch (e) {
              console.log('⚠️ Failed to parse detailed experience element:', e.message);
            }
          }
          
          if (detailedExperiences.length > 0) {
            console.log(`✅ Successfully extracted ${detailedExperiences.length} detailed experiences`);
            break; // Use the first successful selector
          }
        }
      }
      
      // Try to navigate back to main profile (optional)
      if (basicData.profileUrl && window.location.href !== basicData.profileUrl) {
        console.log('🔄 Attempting to navigate back to main profile...');
        try {
          // Look for back button or navigate directly
          const backButton = document.querySelector('button[aria-label*="Back"], a[href*="/in/"]');
          if (backButton) {
            backButton.click();
            await this.wait(2000);
          } else {
            // Navigate back to main profile directly
            window.location.href = basicData.profileUrl;
            await this.wait(3000);
          }
          console.log('✅ Navigated back to main profile');
        } catch (navError) {
          console.log('⚠️ Failed to navigate back to main profile:', navError.message);
        }
      }
      
      return detailedExperiences.length > 0;
      
    } catch (error) {
      console.error('❌ Failed to extract detailed experience data:', error);
      return false;
    }
  }

  async extractNestedPositions(element) {
    console.log('🔍 Checking for nested positions under one company...');
    
    try {
      // Look for patterns that indicate multiple positions under one company
      const nestedSelectors = [
        '.pvs-entity__sub-components .pvs-list__item', // Nested position items
        '.experience-group__positions .experience-item', // Legacy grouped positions
        '[data-view-name="profile-component-entity"] .pvs-list__item', // Entity sub-items
        '.artdeco-entity-lockup .pvs-list__item', // Lockup sub-items
        'ul li', // Generic nested list items within experience element
        '.pvs-list > li' // Direct list children
      ];
      
      let nestedElements = [];
      
      // Try to find nested position elements
      for (const selector of nestedSelectors) {
        const found = element.querySelectorAll(selector);
        if (found.length > 1) { // Only consider if we find multiple items
          nestedElements = Array.from(found);
          logger.debug(`Found ${found.length} nested elements`);
          break;
        }
      }
      
      if (nestedElements.length < 2) {
        console.log('🔍 No nested positions detected, checking for company header pattern...');
        
        // Look for the pattern where company name appears first, then multiple positions
        const elementText = element.textContent || '';
        const lines = elementText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        
        // Try to find a company name in the first few lines
        let companyName = null;
        let companyLineIndex = -1;
        
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          const line = lines[i];
          if (this.isValidCompanyName(line) && !this.isValidJobTitle(line)) {
            companyName = line;
            companyLineIndex = i;
            console.log(`✅ Found potential company header: "${companyName}" at line ${i}`);
            break;
          }
        }
        
        // If we found a company, look for multiple job titles below it
        if (companyName && companyLineIndex >= 0) {
          const potentialTitles = [];
          const potentialDateRanges = [];
          
          // Look for job titles and date ranges after the company name
          for (let i = companyLineIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            if (this.isValidJobTitle(line) && !this.looksLikeJobDescription(line)) {
              potentialTitles.push(line);
              console.log(`🎯 Found potential job title under ${companyName}: "${line}"`);
            } else if (this.looksLikeDateRange(line)) {
              potentialDateRanges.push(line);
            }
          }
          
          // If we found multiple titles, try to create positions
          if (potentialTitles.length > 1) {
            console.log(`✅ Found ${potentialTitles.length} positions under "${companyName}"`);
            const positions = [];
            
            for (let i = 0; i < potentialTitles.length; i++) {
              const position = {
                title: potentialTitles[i],
                company: companyName,
                date_range: potentialDateRanges[i] || '',
                location: '',
                description: `${potentialTitles[i]} at ${companyName}`
              };
              positions.push(position);
            }
            
            return positions;
          }
        }
        
        return null; // No nested positions found
      }
      
      console.log(`🔍 Processing ${nestedElements.length} nested position elements...`);
      
      // Extract company name from the parent element (should be common to all positions)
      let parentCompany = '';
      const parentCompanySelectors = [
        'h3', 'h4', // Main headers
        '.pvs-entity__path-node:first-child', // First path node is usually company
        '.artdeco-entity-lockup__title', // Entity title
        '.experience-company-name' // Direct company name
      ];
      
      for (const selector of parentCompanySelectors) {
        const companyEl = element.querySelector(selector);
        if (companyEl) {
          const companyText = this.deduplicateText(companyEl.textContent?.trim() || '');
          if (this.isValidCompanyName(companyText)) {
            parentCompany = companyText;
            console.log(`✅ Found parent company: "${parentCompany}"`);
            break;
          }
        }
      }
      
      // If no company found at parent level, try to extract from metadata in text
      if (!parentCompany) {
        const elementText = element.textContent || '';
        const lines = elementText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        
        for (const line of lines) {
          const extractedCompany = this.extractCompanyFromMetadata(line);
          if (extractedCompany) {
            parentCompany = extractedCompany;
            console.log(`✅ Found parent company from metadata: "${parentCompany}"`);
            break;
          }
        }
      }
      
      // Extract each nested position
      const positions = [];
      for (let i = 0; i < nestedElements.length; i++) {
        const nestedEl = nestedElements[i];
        console.log(`🔍 Processing nested position ${i + 1}/${nestedElements.length}...`);
        
        const position = await this.extractExperienceFromElement(nestedEl);
        if (position) {
          // Use parent company if the nested extraction didn't find a good company
          if (parentCompany && (!position.company || position.company.length > 100)) {
            position.company = parentCompany;
            console.log(`🔄 Used parent company for position: "${position.title}" at "${parentCompany}"`);
          }
          
          positions.push(position);
        }
      }
      
      if (positions.length > 1) {
        console.log(`✅ Successfully extracted ${positions.length} nested positions`);
        return positions;
      } else {
        console.log('⚠️ Could not extract multiple valid positions from nested elements');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error extracting nested positions:', error);
      return null;
    }
  }

  async extractExperienceFromElement(element) {
    logger.debug('Extracting experience from element...');
    
    // Strategy 1: Look for standard LinkedIn structure
    let title = null, company = null, dateRange = '', location = '';

    // Try various selectors for job title
    const titleSelectors = [
      'h3', 
      '.pvs-entity__path-node', 
      '.artdeco-entity-lockup__title',
      '.pv-entity__summary-info h3',
      'div[data-field="title"]',
      '.experience-item__title',
      'a[data-field="experience-title"]'
    ];

    for (const sel of titleSelectors) {
      const titleEl = element.querySelector(sel);
      if (titleEl && titleEl.textContent?.trim()) {
        const titleText = this.deduplicateText(titleEl.textContent?.trim() || '');
        if (this.isValidJobTitle(titleText)) {
          title = titleText;
          logger.debug('Found title', title);
          break;
        }
      }
    }

    // Try various selectors for company
    const companySelectors = [
      'h4',
      '.pvs-entity__path-node + span',
      '.artdeco-entity-lockup__subtitle',
      '.pv-entity__secondary-title',
      'div[data-field="company"]',
      '.experience-item__company',
      'a[data-field="experience-company-name"]',
      // Sometimes company is in the next sibling
      'h3 + div span',
      'h3 ~ div span'
    ];

    for (const sel of companySelectors) {
      const companyEl = element.querySelector(sel);
      if (companyEl && companyEl.textContent?.trim()) {
        const companyText = this.deduplicateText(companyEl.textContent?.trim() || '');
        if (this.isValidCompanyName(companyText)) {
          company = companyText;
          logger.debug('Found company', company);
          break;
        }
      }
    }

    // Try to find date range
    const dateSelectors = [
      'time',
      '.pvs-entity__caption-wrapper',
      '.pv-entity__date-range',
      'div[data-field="duration"]',
      '.experience-item__duration'
    ];

    for (const sel of dateSelectors) {
      const dateEl = element.querySelector(sel);
      if (dateEl && dateEl.textContent?.trim()) {
        const dateText = dateEl.textContent?.trim() || '';
        if (this.looksLikeDateRange(dateText)) {
          dateRange = dateText;
          logger.debug('Found date range', dateRange);
          break;
        }
      }
    }

    // Try to extract job description
    let description = '';
    const descriptionSelectors = [
      '.pvs-list__item-text',
      '.pv-entity__description',
      '.experience-item__description',
      '.artdeco-entity-lockup__content .pvs-entity__path-node span',
      '.inline-show-more-text',
      '.pvs-entity__sub-components',
      'div[data-field="description"]'
    ];

    for (const sel of descriptionSelectors) {
      const descEl = element.querySelector(sel);
      if (descEl) {
        let descText = '';
        
        // Check if it's a "show more" expandable element
        const showMoreBtn = descEl.querySelector('.inline-show-more-text__button, .show-more-less-html__button');
        if (showMoreBtn) {
          logger.debug('Found show more button, clicking to expand...');
          try {
            showMoreBtn.click();
            // Wait a moment for content to expand
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (e) {
            console.log('⚠️ Could not click show more button:', e);
          }
        }
        
        // Extract all text content, preserving paragraph structure
        const textNodes = [];
        const walker = document.createTreeWalker(
          descEl,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent?.trim();
          if (text && text.length > 3 && !text.match(/^(show|see|more|less)$/i)) {
            textNodes.push(text);
          }
        }
        
        if (textNodes.length > 0) {
          // Join with proper spacing and clean up
          descText = textNodes.join(' ').replace(/\s+/g, ' ').trim();
          
          // Filter out metadata and unwanted content
          if (descText.length > 20 && 
              !this.looksLikeDateRange(descText) && 
              !this.looksLikeMetadata(descText) &&
              !descText.toLowerCase().includes('skills:') &&
              !descText.match(/^(full-time|part-time|contract|permanent)$/i)) {
            
            description = this.deduplicateText(descText);
            logger.debug('Found description', description.substring(0, 50) + '...');
            break;
          }
        }
      }
    }

    // If no structured description found, look in the element's direct text content
    if (!description) {
      console.log('🔍 No structured description found, extracting from element text...');
      const elementText = element.textContent || '';
      const lines = elementText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      
      // Look for description-like content (longer lines that aren't titles/companies/dates)
      for (const line of lines) {
        const cleanLine = this.deduplicateText(line);
        if (cleanLine.length > 50 && 
            !this.isValidJobTitle(cleanLine) && 
            !this.isValidCompanyName(cleanLine) && 
            !this.looksLikeDateRange(cleanLine) && 
            !this.looksLikeMetadata(cleanLine) &&
            !cleanLine.toLowerCase().includes('skills:')) {
          
          description = cleanLine;
          console.log(`✅ Found description from text content: ${description.substring(0, 100)}...`);
          break;
        }
      }
    }

    // Strategy 2: If structured approach fails, try improved text-based extraction
    if (!title || !company) {
      console.log('⚠️ Structured extraction failed, trying text-based approach...');
      const elementText = element.textContent || '';
      const lines = elementText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      
      console.log(`🔍 Analyzing ${lines.length} text lines:`, lines.slice(0, 5));
      console.log(`🔍 All text lines being processed:`, lines);
      
      // Strategy 2A: Look for title AND company patterns with flexible ordering
      let potentialTitles = [];
      let potentialCompanies = [];
      
      // First pass: collect potential titles and companies
      for (let i = 0; i < lines.length; i++) {
        const line = this.deduplicateText(lines[i]);
        
        console.log(`🔍 Processing line ${i}: "${line}"`);
        
        if (line.length < 3 || this.looksLikeDateRange(line) || this.looksLikeMetadata(line)) {
          console.log(`⏭️ Skipping line ${i}: too short or is date/metadata`);
          continue;
        }
        
        if (this.isValidJobTitle(line)) {
          potentialTitles.push({ text: line, index: i });
          console.log(`🎯 Found potential job title: "${line}"`);
        }
        
        if (this.isValidCompanyName(line)) {
          potentialCompanies.push({ text: line, index: i });
          console.log(`🏢 Found potential company: "${line}"`);
        } else {
          // Try to extract company from metadata patterns
          console.log(`🔍 Attempting metadata extraction for line: "${line}"`);
          const extractedCompany = this.extractCompanyFromMetadata(line);
          if (extractedCompany) {
            potentialCompanies.push({ text: extractedCompany, index: i });
            console.log(`🏢 Found potential company from metadata: "${extractedCompany}"`);
          } else {
            console.log(`❌ No company extracted from metadata for: "${line}"`);
          }
        }
      }
      
      // Second pass: try to match titles with companies
      if (potentialTitles.length > 0 && potentialCompanies.length > 0) {
        // Prefer the first valid title and first valid company
        title = potentialTitles[0].text;
        company = potentialCompanies[0].text;
        console.log(`✅ Matched title-company pair: "${title}" → "${company}"`);
      } else if (potentialTitles.length > 0) {
        // If we have a title but no clear company, look for any remaining text
        title = potentialTitles[0].text;
        
        // Look for a potential company that might not have passed strict validation
        for (let i = 0; i < lines.length; i++) {
          const line = this.deduplicateText(lines[i]);
          if (line !== title && line.length > 2 && 
              !this.looksLikeDateRange(line) && !this.looksLikeMetadata(line) &&
              !line.toLowerCase().includes('skills:') &&
              !this.isValidJobTitle(line)) {
            
            // Try to extract company name from metadata-rich strings like "AEON Corporation · Permanent"
            const cleanedCompany = this.extractCompanyFromMetadata(line);
            if (cleanedCompany && cleanedCompany.length > 2) {
              company = cleanedCompany;
              console.log(`✅ Found backup company for title "${title}": "${company}"`);
              break;
            } else if (line.length < 100 && !this.looksLikeJobDescription(line)) { 
              // Only use as company if it's short and doesn't look like a job description
              company = line;
              console.log(`✅ Found backup company for title "${title}": "${company}"`);
              break;
            }
          }
        }
      }
      
      // Strategy 2B: If still no match, try alternative patterns
      if (!title || !company) {
        console.log('⚠️ Sequential pattern failed, trying alternative patterns...');
        const altResult = this.tryAlternativeTextPatterns(lines, { title, company });
        title = altResult.title || title;
        company = altResult.company || company;
      }
    }

    // Return experience if we found both title and company
    if (title && company && title !== company) {
      // Use extracted description or fallback to basic format
      const finalDescription = description || `${title} at ${company}`;
      
      return {
        title: title,
        company: company,
        date_range: dateRange,
        location: location,
        description: finalDescription
      };
    }

    console.log('⚠️ Could not extract valid experience from element');
    return null;
  }

  async extractEducationBasic() {
    logger.debug('Extracting education info...');

    const educations = [];

    try {
      // Look for education section with multiple selectors
      const educationSelectors = [
        '#education',
        '.education-section',
        '[data-section="education"]',
        'section[id*="education"]'
      ];
      
      let eduSection = null;
      for (const selector of educationSelectors) {
        eduSection = document.querySelector(selector);
        if (eduSection) {
          logger.debug('Found education section');
          break;
        }
      }
      
      if (!eduSection) {
        console.log('⚠️ Education section not found - checking page structure...');
        this.debugEducationSection();
        return educations;
      }

      // Scroll to education section to ensure it's loaded
      console.log('📍 Scrolling to education section...');
      eduSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(2000);

      // Try to click "Show all education" button if it exists
      await this.clickShowAllEducation();

      // Try structured extraction first
      const structuredEducations = await this.extractStructuredEducation();
      if (structuredEducations.length > 0) {
        console.log(`✅ Found ${structuredEducations.length} structured education entries`);
        return structuredEducations;
      }

      // Fallback to text-based extraction
      console.log('⚠️ Falling back to text-based education extraction...');
      
      // Get all text from the education section and analyze it
      const educationText = eduSection.textContent || '';
      console.log(`📍 Education section text (first 300 chars): ${educationText.substring(0, 300)}...`);
      
      // Split into meaningful lines
      const lines = educationText
        .split('\n')
        .map(line => this.deduplicateText(line.trim()))
        .filter(line => line.length > 2 && line.length < 150)
        .filter(line => {
          const lowerLine = line.toLowerCase();
          return !lowerLine.includes('education') && // Skip section header
                 !lowerLine.includes('show all') && // Skip "Show all" buttons
                 !lowerLine.includes('show ') && // Skip "Show" buttons
                 !lowerLine.includes('view ') && // Skip "View" links
                 !lowerLine.includes('ago') && // Skip "2 months ago" type text
                 !lowerLine.includes('connection') && // Skip connection text
                 !lowerLine.includes('mutual') && // Skip mutual connections
                 !lowerLine.includes('message') && // Skip message buttons
                 !line.match(/^\d+$/); // Skip standalone numbers
        });

      console.log(`📍 Filtered education lines (first 10): ${lines.slice(0, 10).join(' | ')}`);

      // Parse education entries
      const potentialSchools = [];
      const potentialDegrees = [];
      const dateRanges = [];
      
      // Collect potential schools, degrees, and dates
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (this.looksLikeDateRange(line)) {
          dateRanges.push({ text: line, index: i });
          continue;
        }
        
        if (this.isValidSchoolName(line)) {
          potentialSchools.push({ text: line, index: i });
          console.log(`🏫 Found potential school: "${line}"`);
        }
        
        if (this.isValidDegreeName(line)) {
          potentialDegrees.push({ text: line, index: i });
          console.log(`🎓 Found potential degree: "${line}"`);
        }
      }
      
      // Match schools with degrees based on proximity
      for (const school of potentialSchools) {
        let closestDegree = null;
        let smallestDistance = Infinity;
        
        for (const degree of potentialDegrees) {
          const distance = Math.abs(degree.index - school.index);
          if (distance < smallestDistance && distance <= 3) {
            smallestDistance = distance;
            closestDegree = degree;
          }
        }
        
        // Find the closest date range
        let closestDate = '';
        let smallestDateDistance = Infinity;
        
        for (const dateRange of dateRanges) {
          const distance = Math.abs(dateRange.index - school.index);
          if (distance < smallestDateDistance && distance <= 3) {
            smallestDateDistance = distance;
            closestDate = dateRange.text;
          }
        }
        
        const education = {
          school: school.text,
          degree: closestDegree ? closestDegree.text : '',
          date_range: closestDate,
          field_of_study: ''
        };
        
        educations.push(education);
        console.log(`✅ Matched education: "${school.text}" - "${education.degree || 'No degree'}" (${closestDate})`);
        
        // Remove used degree to avoid duplicates
        if (closestDegree) {
          const degreeIndex = potentialDegrees.indexOf(closestDegree);
          if (degreeIndex > -1) {
            potentialDegrees.splice(degreeIndex, 1);
          }
        }
      }

      console.log(`✅ Extracted ${educations.length} education entries`);

    } catch (error) {
      console.error('❌ Failed to extract education:', error);
    }

    return educations;
  }

  async clickShowAllEducation() {
    logger.debug('Looking for show all education button...');
    
    try {
      const showAllSelectors = [
        'button[aria-label*="Show all"][aria-label*="education"]',
        'button[aria-label*="education"][aria-label*="Show"]',
        'a[href*="education"]',
        '#education ~ * button[aria-label*="Show"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button'
      ];

      for (const selector of showAllSelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          logger.debug('Found education show all button');
          try {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);
            button.click();
            await this.wait(2000);
            logger.debug('Clicked show all education button');
            return true;
          } catch (clickError) {
            console.log(`⚠️ Failed to click education button with selector ${selector}:`, clickError.message);
          }
        }
      }
      
      logger.debug('No show all education button found');
      return false;
    } catch (error) {
      console.error('❌ Failed to click show all education:', error);
      return false;
    }
  }

  async extractStructuredEducation() {
    console.log('🏗️ Attempting structured education extraction...');

    const educations = [];

    try {
      // Updated selectors for current LinkedIn structure
      const educationSelectors = [
        '#education ~ div .pvs-list__item--line-separated',
        '#education ~ * .pvs-list__item--line-separated',
        '.pvs-list__item--line-separated',
        '.pvs-entity__path-node',
        '.education-item',
        '[data-view-name="profile-component-entity"]',
        '#education + div li',
        '#education ~ div li'
      ];

      for (const selector of educationSelectors) {
        const eduElements = document.querySelectorAll(selector);
        
        if (eduElements.length > 0) {
          logger.debug(`Found ${eduElements.length} education elements`);
          
          for (const eduEl of eduElements) {
            try {
              const extractedEdu = this.extractEducationFromElement(eduEl);
              if (extractedEdu) {
                educations.push(extractedEdu);
                console.log(`✅ Structured education extraction: "${extractedEdu.school}" - "${extractedEdu.degree}"`);
              }
            } catch (e) {
              console.log('⚠️ Failed to parse education element:', e.message);
            }
          }
          
          if (educations.length > 0) {
            console.log(`✅ Successfully extracted ${educations.length} education entries with selector: ${selector}`);
            break;
          }
        }
      }

    } catch (error) {
      console.error('❌ Structured education extraction failed:', error);
    }

    return educations;
  }

  extractEducationFromElement(element) {
    logger.debug('Extracting education from element...');
    
    let school = null, degree = null, dateRange = '', fieldOfStudy = '';

    // Try various selectors for school name
    const schoolSelectors = [
      'h3',
      '.pvs-entity__path-node',
      '.education-item__school',
      'div[data-field="school"]',
      'a[data-field="education-school-name"]'
    ];

    for (const sel of schoolSelectors) {
      const schoolEl = element.querySelector(sel);
      if (schoolEl && schoolEl.textContent?.trim()) {
        const schoolText = this.deduplicateText(schoolEl.textContent?.trim() || '');
        if (this.isValidSchoolName(schoolText)) {
          school = schoolText;
          logger.debug('Found school', school);
          break;
        }
      }
    }

    // Try various selectors for degree
    const degreeSelectors = [
      'h4',
      '.pvs-entity__path-node + span',
      '.education-item__degree',
      'div[data-field="degree"]',
      'h3 + div span',
      'h3 ~ div span'
    ];

    for (const sel of degreeSelectors) {
      const degreeEl = element.querySelector(sel);
      if (degreeEl && degreeEl.textContent?.trim()) {
        const degreeText = this.deduplicateText(degreeEl.textContent?.trim() || '');
        if (this.isValidDegreeName(degreeText)) {
          degree = degreeText;
          logger.debug('Found degree', degree);
          break;
        }
      }
    }

    // Try to find date range
    const dateSelectors = [
      'time',
      '.pvs-entity__caption-wrapper',
      '.education-item__duration'
    ];

    for (const sel of dateSelectors) {
      const dateEl = element.querySelector(sel);
      if (dateEl && dateEl.textContent?.trim()) {
        const dateText = dateEl.textContent?.trim() || '';
        if (this.looksLikeDateRange(dateText)) {
          dateRange = dateText;
          break;
        }
      }
    }

    // If structured approach fails, try text-based extraction
    if (!school) {
      console.log('⚠️ Structured school extraction failed, trying text-based approach...');
      const elementText = element.textContent || '';
      const lines = elementText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      
      for (const line of lines) {
        const cleanLine = this.deduplicateText(line);
        if (this.isValidSchoolName(cleanLine)) {
          school = cleanLine;
          console.log(`✅ Found school via text parsing: "${school}"`);
          break;
        }
      }
    }

    // Return education if we found a school
    if (school && school.length > 2) {
      return {
        school: school,
        degree: degree || '',
        date_range: dateRange,
        field_of_study: fieldOfStudy
      };
    }

    console.log('⚠️ Could not extract valid education from element');
    return null;
  }

  isValidSchoolName(text) {
    if (!text || text.length < 3 || text.length > 100) return false;
    
    const lowerText = text.toLowerCase();
    
    // Skip common non-school patterns
    if (lowerText.match(/^\d{4}/) || // Starts with year
        lowerText.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/) || // Contains month
        lowerText.includes('·') ||
        lowerText.includes('full-time') ||
        lowerText.includes('part-time') ||
        lowerText.includes('bachelor') ||
        lowerText.includes('master') ||
        lowerText.includes('degree') ||
        lowerText.includes('yrs') ||
        lowerText.includes('mos')) {
      return false;
    }

    // School indicators
    const schoolIndicators = [
      'university', 'college', 'school', 'institute', 'academy',
      'polytechnic', 'seminary', 'conservatory', 'tech',
      'state university', 'community college', 'junior college'
    ];
    
    const hasSchoolWords = schoolIndicators.some(word => lowerText.includes(word));
    
    // Check for proper capitalization (most school names are capitalized)
    const words = text.trim().split(/\s+/);
    const hasProperCapitalization = words.some(word => /^[A-Z]/.test(word));
    
    return hasSchoolWords || (hasProperCapitalization && words.length >= 1);
  }

  isValidDegreeName(text) {
    if (!text || text.length < 2 || text.length > 100) return false;
    
    const lowerText = text.toLowerCase();
    
    // Skip common non-degree patterns
    if (lowerText.match(/^\d{4}/) || // Starts with year
        lowerText.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/) || // Contains month
        lowerText.includes('·') ||
        lowerText.includes('university') ||
        lowerText.includes('college') ||
        lowerText.includes('school') ||
        lowerText.includes('yrs') ||
        lowerText.includes('mos')) {
      return false;
    }

    // Degree indicators
    const degreeIndicators = [
      'bachelor', 'master', 'doctorate', 'phd', 'md', 'jd', 'mba',
      'bs', 'ba', 'ms', 'ma', 'degree', 'diploma', 'certificate',
      'associate', 'graduate', 'undergraduate', 'bsc', 'msc',
      'engineering', 'science', 'arts', 'business', 'education'
    ];
    
    return degreeIndicators.some(word => lowerText.includes(word));
  }

  debugEducationSection() {
    console.log('🔍 DEBUG: Analyzing education section structure...');
    
    // Look for any element that might contain education info
    const possibleEducationElements = [
      document.querySelector('section[id*="education"]'),
      document.querySelector('[data-section*="education"]'),
      document.querySelector('.education'),
      ...Array.from(document.querySelectorAll('h2')).filter(h2 => 
        h2.textContent?.toLowerCase().includes('education'))
    ];
    
    console.log('📍 Possible education elements found:', possibleEducationElements.length);
    
    possibleEducationElements.forEach((el, i) => {
      if (el) {
        console.log(`Education element ${i}:`, {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          textPreview: el.textContent?.substring(0, 100)
        });
      }
    });
    
    // Check for common LinkedIn structure patterns
    const commonStructures = [
      '.pvs-list__item--line-separated',
      '.pvs-entity__path-node',
      'section[data-section]'
    ];
    
    commonStructures.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      logger.debug(`Found ${elements.length} elements`);
    });
  }

  // Comprehensive validation and data quality assurance
  validateAndCleanProfileData(profileData) {
    console.log('🔍 Validating and cleaning profile data...');
    
    const validatedData = {
      personal_info: this.validatePersonalInfo(profileData.personal_info || {}),
      summary: this.validateSummary(profileData.summary || ''),
      work_experience: this.validateExperiences(profileData.work_experience || []),
      education: this.validateEducations(profileData.education || []),
      skills: this.validateSkills(profileData.skills || []),
      projects: profileData.projects || [],
      languages: profileData.languages || [],
      certifications: this.validateCertifications(profileData.certifications || [])
    };
    
    // Log validation results
    console.log('✅ Data validation completed:', {
      personal_info_valid: Object.keys(validatedData.personal_info).length > 0,
      summary_valid: validatedData.summary.length > 0,
      experience_count: validatedData.work_experience.length,
      education_count: validatedData.education.length,
      skills_count: validatedData.skills.length,
      certifications_count: validatedData.certifications.length
    });
    
    return validatedData;
  }

  validatePersonalInfo(personalInfo) {
    console.log('👤 Validating personal information...');
    
    const validated = {};
    
    // Validate name fields
    if (personalInfo.full_name && typeof personalInfo.full_name === 'string' && 
        personalInfo.full_name.trim().length > 0) {
      validated.full_name = personalInfo.full_name.trim();
      validated.name = validated.full_name; // Compatibility
      
      // Parse first and last name if not already present
      if (!personalInfo.first_name || !personalInfo.last_name) {
        const nameParts = validated.full_name.split(' ').filter(part => part.length > 0);
        if (nameParts.length >= 2) {
          validated.first_name = nameParts[0];
          validated.last_name = nameParts[nameParts.length - 1];
        } else if (nameParts.length === 1) {
          validated.first_name = nameParts[0];
        }
      } else {
        validated.first_name = personalInfo.first_name;
        validated.last_name = personalInfo.last_name;
      }
    }
    
    // Validate headline
    if (personalInfo.headline && typeof personalInfo.headline === 'string' && 
        personalInfo.headline.trim().length > 5) {
      validated.headline = personalInfo.headline.trim();
    }
    
    // Validate location
    if (personalInfo.location && typeof personalInfo.location === 'string' && 
        personalInfo.location.trim().length > 2) {
      validated.location = personalInfo.location.trim();
    }
    
    // Validate email
    if (personalInfo.email && typeof personalInfo.email === 'string' && 
        personalInfo.email.includes('@') && personalInfo.email.includes('.')) {
      validated.email = personalInfo.email.trim().toLowerCase();
    }
    
    // Validate phone
    if (personalInfo.phone && typeof personalInfo.phone === 'string' && 
        personalInfo.phone.trim().length > 5) {
      validated.phone = personalInfo.phone.trim();
    }
    
    // Validate website
    if (personalInfo.website && typeof personalInfo.website === 'string' && 
        (personalInfo.website.startsWith('http') || personalInfo.website.includes('.'))) {
      validated.website = personalInfo.website.trim();
    }
    
    // Validate LinkedIn URL
    if (personalInfo.linkedin && typeof personalInfo.linkedin === 'string' && 
        personalInfo.linkedin.includes('linkedin.com')) {
      validated.linkedin = personalInfo.linkedin.trim();
    }
    
    console.log(`✅ Personal info validation: ${Object.keys(validated).length} fields validated`);
    return validated;
  }

  validateSummary(summary) {
    console.log('📝 Validating summary...');
    
    if (!summary || typeof summary !== 'string') {
      console.log('⚠️ Summary is empty or invalid');
      return '';
    }
    
    const cleaned = summary.trim();
    
    if (cleaned.length < 10) {
      console.log('⚠️ Summary too short, discarding');
      return '';
    }
    
    if (cleaned.length > 10000) {
      console.log('⚠️ Summary too long, truncating');
      return cleaned.substring(0, 10000) + '...';
    }
    
    console.log(`✅ Summary validated: ${cleaned.length} characters`);
    return cleaned;
  }

  validateExperiences(experiences) {
    console.log('💼 Validating work experiences...');
    
    if (!Array.isArray(experiences)) {
      console.log('⚠️ Experiences is not an array');
      return [];
    }
    
    const validatedExperiences = [];
    
    for (const exp of experiences) {
      if (!exp || typeof exp !== 'object') continue;
      
      const validatedExp = {};
      
      // Validate title
      if (exp.title && typeof exp.title === 'string' && exp.title.trim().length > 2) {
        validatedExp.title = exp.title.trim();
      } else {
        console.log('⚠️ Skipping experience with invalid title:', exp);
        continue;
      }
      
      // Validate company
      if (exp.company && typeof exp.company === 'string' && exp.company.trim().length > 1) {
        validatedExp.company = exp.company.trim();
      } else {
        console.log('⚠️ Skipping experience with invalid company:', exp);
        continue;
      }
      
      // Validate date range
      if (exp.date_range && typeof exp.date_range === 'string') {
        validatedExp.date_range = exp.date_range.trim();
      } else {
        validatedExp.date_range = '';
      }
      
      // Validate location
      if (exp.location && typeof exp.location === 'string') {
        validatedExp.location = exp.location.trim();
      } else {
        validatedExp.location = '';
      }
      
      // Validate description
      if (exp.description && typeof exp.description === 'string') {
        validatedExp.description = exp.description.trim();
      } else {
        validatedExp.description = `${validatedExp.title} at ${validatedExp.company}`;
      }
      
      validatedExperiences.push(validatedExp);
    }
    
    console.log(`✅ Experience validation: ${validatedExperiences.length} out of ${experiences.length} experiences validated`);
    return validatedExperiences;
  }

  validateEducations(educations) {
    console.log('🎓 Validating education entries...');
    
    if (!Array.isArray(educations)) {
      console.log('⚠️ Education is not an array');
      return [];
    }
    
    const validatedEducations = [];
    
    for (const edu of educations) {
      if (!edu || typeof edu !== 'object') continue;
      
      const validatedEdu = {};
      
      // Validate school
      if (edu.school && typeof edu.school === 'string' && edu.school.trim().length > 2) {
        validatedEdu.school = edu.school.trim();
      } else {
        console.log('⚠️ Skipping education with invalid school:', edu);
        continue;
      }
      
      // Validate degree
      if (edu.degree && typeof edu.degree === 'string' && edu.degree.trim().length > 0) {
        validatedEdu.degree = edu.degree.trim();
      } else {
        validatedEdu.degree = '';
      }
      
      // Validate date range
      if (edu.date_range && typeof edu.date_range === 'string') {
        validatedEdu.date_range = edu.date_range.trim();
      } else {
        validatedEdu.date_range = '';
      }
      
      // Validate field of study
      if (edu.field_of_study && typeof edu.field_of_study === 'string') {
        validatedEdu.field_of_study = edu.field_of_study.trim();
      } else {
        validatedEdu.field_of_study = '';
      }
      
      validatedEducations.push(validatedEdu);
    }
    
    console.log(`✅ Education validation: ${validatedEducations.length} out of ${educations.length} education entries validated`);
    return validatedEducations;
  }

  validateSkills(skills) {
    console.log('🛠️ Validating skills...');
    
    if (!Array.isArray(skills)) {
      console.log('⚠️ Skills is not an array');
      return [];
    }
    
    const validatedSkills = [];
    const seenSkills = new Set();
    
    for (const skill of skills) {
      if (!skill || typeof skill !== 'string') continue;
      
      const cleanSkill = skill.trim();
      
      // Skip if empty, too short, or too long
      if (cleanSkill.length < 2 || cleanSkill.length > 80) continue;
      
      // Skip if already seen (case-insensitive)
      const lowerSkill = cleanSkill.toLowerCase();
      if (seenSkills.has(lowerSkill)) continue;
      
      // Additional validation using existing isValidSkill method
      if (this.isValidSkill(cleanSkill)) {
        validatedSkills.push(cleanSkill);
        seenSkills.add(lowerSkill);
      }
    }
    
    console.log(`✅ Skills validation: ${validatedSkills.length} out of ${skills.length} skills validated`);
    return validatedSkills;
  }

  validateCertifications(certifications) {
    console.log('🏆 Validating certifications...');
    
    if (!Array.isArray(certifications)) {
      console.log('⚠️ Certifications is not an array');
      return [];
    }
    
    const validatedCertifications = [];
    
    for (const cert of certifications) {
      if (!cert || typeof cert !== 'object') continue;
      
      const validatedCert = {};
      
      // Validate certification name
      if (cert.name && typeof cert.name === 'string' && cert.name.trim().length > 2) {
        validatedCert.name = cert.name.trim();
      } else {
        console.log('⚠️ Skipping certification with invalid name:', cert);
        continue;
      }
      
      // Validate issuer
      if (cert.issuer && typeof cert.issuer === 'string' && cert.issuer.trim().length > 0) {
        validatedCert.issuer = cert.issuer.trim();
      } else {
        validatedCert.issuer = '';
      }
      
      validatedCertifications.push(validatedCert);
    }
    
    console.log(`✅ Certification validation: ${validatedCertifications.length} out of ${certifications.length} certifications validated`);
    return validatedCertifications;
  }

  async scrollToLoadAllSections() {
    console.log('📜 Scrolling to load all profile sections...');

    try {
      // Get the full page height safely
      const totalHeight = Math.max(
        document.body?.scrollHeight || 0,
        document.documentElement?.scrollHeight || 0,
        window.innerHeight || 1000 // fallback
      );

      if (totalHeight === 0) {
        console.log('⚠️ Could not determine page height, using fallback');
        return;
      }

      // Scroll down gradually to trigger lazy loading
      const scrollSteps = 8;
      const scrollDelay = 1500; // Increased delay

      for (let i = 0; i < scrollSteps; i++) {
        const scrollPosition = (totalHeight / scrollSteps) * (i + 1);
        try {
          window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
          await this.wait(scrollDelay);
          
          // Log progress for debugging
          console.log(`📜 Scroll step ${i + 1}/${scrollSteps} - position: ${scrollPosition}px`);
        } catch (scrollError) {
          console.log(`⚠️ Scroll step ${i + 1} failed:`, scrollError.message);
          // Continue with next step
        }
      }

      // Scroll to specific sections to ensure they're loaded
      const sectionsToLoad = ['#about', '#experience', '#education', '#skills'];
      for (const sectionId of sectionsToLoad) {
        try {
          const section = document.querySelector(sectionId);
          if (section) {
            console.log(`📍 Loading section: ${sectionId}`);
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(1000);
          }
        } catch (sectionError) {
          console.log(`⚠️ Failed to scroll to section ${sectionId}:`, sectionError.message);
        }
      }

      // Scroll back to top
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await this.wait(1500);
      } catch (topScrollError) {
        console.log('⚠️ Failed to scroll to top:', topScrollError.message);
      }

      console.log('✅ Profile sections loaded');
    } catch (error) {
      console.error('❌ Failed to scroll and load sections:', error);
      // Don't throw error - continue with extraction
    }
  }

  async wait(ms) {
    // Input validation
    const waitTime = Math.max(0, Math.min(ms || 0, 10000)); // Cap at 10 seconds
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Helper method to extract company name from metadata-rich strings
  extractCompanyFromMetadata(text) {
    if (!text || typeof text !== 'string') return null;
    
    logger.debug('Extracting from metadata', text);
    // Character codes debug removed for cleaner logging
    
    // Handle patterns like "AEON Corporation · Permanent", "Gaba Corporation · Part-time", etc.
    // Note: LinkedIn might use different bullet characters
    const metadataPatterns = [
      /^([^·•\u2022\u2027]+)\s*[·•\u2022\u2027]\s*(permanent|part-time|full-time|contract)/i,
      /^([^·•\u2022\u2027]+)\s*[·•\u2022\u2027]\s*\w+$/i, // Generic "Company · Something" pattern
      /^(.+?)\s+[·•\u2022\u2027]\s+.+$/i     // Even more generic fallback
    ];
    
    for (let i = 0; i < metadataPatterns.length; i++) {
      const pattern = metadataPatterns[i];
      console.log(`🔍 DEBUG: Testing pattern ${i + 1}: ${pattern}`);
      const match = text.match(pattern);
      if (match && match[1]) {
        const companyName = match[1].trim();
        console.log(`🎯 DEBUG: Pattern ${i + 1} matched! Raw extraction: "${companyName}"`);
        console.log(`🔍 Testing metadata pattern: "${text}" → potential company: "${companyName}"`);
        if (this.isValidCompanyName(companyName)) {
          console.log(`🏢 Extracted company from metadata: "${text}" → "${companyName}"`);
          return companyName;
        } else {
          console.log(`❌ "${companyName}" failed company validation`);
        }
      } else {
        console.log(`❌ DEBUG: Pattern ${i + 1} did not match`);
      }
    }
    
    return null;
  }

  // Helper method to fix text deduplication issues
  deduplicateText(text) {
    if (!text || typeof text !== 'string') return text || '';
    
    // LinkedIn sometimes duplicates text content
    // Example: "Embassy SuitesEmbassy Suites" -> "Embassy Suites"
    
    const trimmed = text.trim();
    const length = trimmed.length;
    
    // If text length is even, check if it's a perfect duplication
    if (length > 6 && length % 2 === 0) {
      const halfLength = length / 2;
      const firstHalf = trimmed.substring(0, halfLength);
      const secondHalf = trimmed.substring(halfLength);
      
      if (firstHalf === secondHalf) {
        console.log(`🔧 Fixed duplicated text: "${trimmed}" -> "${firstHalf}"`);
        return firstHalf;
      }
    }
    
    // Also check for common duplication patterns with slight variations
    // Look for patterns like "TextText" where Text appears twice consecutively
    const words = trimmed.split(/\s+/);
    if (words.length >= 2) {
      // Find the longest repeating substring at the beginning
      for (let i = 1; i <= Math.floor(words.length / 2); i++) {
        const firstPart = words.slice(0, i).join(' ');
        const secondPart = words.slice(i, i * 2).join(' ');
        
        if (firstPart === secondPart && firstPart.length > 3) {
          const remainder = words.slice(i * 2).join(' ');
          const result = remainder ? `${firstPart} ${remainder}` : firstPart;
          console.log(`🔧 Fixed word-level duplication: "${trimmed}" -> "${result}"`);
          return result;
        }
      }
    }
    
    return trimmed;
  }

  // Debug method to help diagnose extraction issues
  debugPageStructure() {
    console.log('🔍 DEBUG: Analyzing LinkedIn page structure...');
    
    const sections = {
      about: document.querySelector('#about'),
      experience: document.querySelector('#experience'),
      education: document.querySelector('#education'),
      skills: document.querySelector('#skills'),
      name: document.querySelector('h1.text-heading-xlarge'),
      headline: document.querySelector('.text-body-medium.break-words'),
      location: document.querySelector('.text-body-small.inline.t-black--light.break-words')
    };

    console.log('📍 Section availability:', Object.entries(sections).map(([key, el]) => 
      `${key}: ${el ? '✅' : '❌'}`
    ).join(', '));

    // Debug experience section in detail
    if (sections.experience) {
      console.log('💼 Experience section detailed analysis:');
      
      // Check various possible containers for experience items
      const expContainers = [
        '#experience + div',
        '#experience ~ div', 
        '#experience + section',
        '#experience ~ section'
      ];
      
      for (const selector of expContainers) {
        const container = document.querySelector(selector);
        if (container) {
          logger.debug('Found experience container');
          console.log(`   - Text preview: "${container.textContent?.substring(0, 150)}..."`);
          console.log(`   - Child elements: ${container.children.length}`);
          console.log(`   - Has .pvs-list__item--line-separated: ${container.querySelectorAll('.pvs-list__item--line-separated').length}`);
          console.log(`   - Has .pvs-entity__path-node: ${container.querySelectorAll('.pvs-entity__path-node').length}`);
        }
      }
      
      // Check for "Show all experiences" buttons
      const showAllButtons = document.querySelectorAll('button[aria-label*="Show"], a[href*="experience"]');
      logger.debug(`Found ${showAllButtons.length} potential show all buttons`);
      showAllButtons.forEach((btn, i) => {
        console.log(`   Button ${i}: "${btn.textContent?.trim()}" (${btn.tagName})`);
      });
    }

    // Debug skills section
    if (sections.skills) {
      console.log('🛠️ Skills section detailed analysis:');
      const skillsContainer = document.querySelector('#skills + div, #skills ~ div');
      if (skillsContainer) {
        console.log(`   - Skills container found`);
        console.log(`   - Text preview: "${skillsContainer.textContent?.substring(0, 150)}..."`);
        console.log(`   - Has .pvs-entity__path-node: ${skillsContainer.querySelectorAll('.pvs-entity__path-node').length}`);
      }
    }

    // Log all pvs-list items (common LinkedIn structure)
    const allPvsList = document.querySelectorAll('.pvs-list__item--line-separated');
    console.log(`📋 Found ${allPvsList.length} total .pvs-list__item--line-separated elements`);
    
    // Log all path nodes (common for skills, experience, etc.)
    const allPathNodes = document.querySelectorAll('.pvs-entity__path-node');
    console.log(`📋 Found ${allPathNodes.length} total .pvs-entity__path-node elements`);
    Array.from(allPathNodes).slice(0, 5).forEach((node, i) => {
      console.log(`   Path node ${i}: "${node.textContent?.trim()}"`);
    });

    return sections;
  }
}