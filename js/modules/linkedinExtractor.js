// LinkedIn Profile Data Extractor
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

    console.log('🔍 Extracting LinkedIn profile data step by step...');

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

      // Log the final profile data for debugging
      console.log('FINAL PROFILE DATA:', JSON.stringify(profileData, null, 2));

      console.log('✅ LinkedIn profile data extracted successfully');
      console.log('📊 Extraction Summary:', {
        personal_info: Object.keys(profileData.personal_info || {}).length,
        summary: profileData.summary?.length || 0,
        work_experience: profileData.work_experience?.length || 0,
        education: profileData.education?.length || 0,
        skills: profileData.skills?.length || 0,
        certifications: profileData.certifications?.length || 0
      });

      return profileData;

    } catch (error) {
      console.error('❌ Failed to extract LinkedIn data:', error);
      throw error;
    }
  }

  async extractPersonalInfo() {
    console.log('👤 Extracting personal info...');

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
        console.log(`⚠️ Failed to evaluate selector "${selector}":`, error.message);
        continue;
      }

      if (nameEl && nameEl.textContent?.trim()) {
        const fullName = nameEl.textContent.trim();
        // Validate that this looks like a name (allow international characters)
        if (fullName.length > 2 && fullName.length < 100 && 
            /^[\p{L}\p{M}\s\-\.\']+$/u.test(fullName) && // Unicode support for international names
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
          console.log(`✅ Found name with selector "${selector}": ${fullName}`);
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
        console.log(`⚠️ Failed to evaluate headline selector "${selector}":`, error.message);
        continue;
      }

      if (headlineEl && headlineEl.textContent?.trim()) {
        const headline = headlineEl.textContent.trim();
        // Skip if this looks like a name instead of headline or is too short/long
        if (headline.length > 5 && headline.length < 200 && 
            !headline.includes(personalInfo.full_name || '') &&
            headline !== personalInfo.full_name) {
          personalInfo.headline = headline;
          console.log(`✅ Found headline with selector "${selector}": ${headline.substring(0, 50)}...`);
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
        console.log(`⚠️ Failed to evaluate location selector "${selector}":`, error.message);
        continue;
      }

      if (locationEl && locationEl.textContent?.trim()) {
        const location = locationEl.textContent.trim();
        // Enhanced validation for location
        if (location.length > 2 && location.length < 100 && 
            !location.includes('@') && !location.includes('http') &&
            location !== personalInfo.full_name && location !== personalInfo.headline &&
            // Check if it looks like a location (contains common location words or patterns)
            (/\b(city|state|country|,|\s-\s)/i.test(location) || location.split(' ').length <= 4)) {
          personalInfo.location = location;
          console.log(`✅ Found location with selector "${selector}": ${location}`);
          break;
        }
      }
    }

    // LinkedIn URL
    personalInfo.linkedin = window.location?.href?.split('?')[0] || '';

    console.log('✅ Extracted personal info from LinkedIn');
    return personalInfo;
  }

  async extractContactInfo(personalInfo) {
    console.log('📞 Extracting contact info...');

    if (!personalInfo) {
      console.log('⚠️ No personalInfo object provided, creating new one');
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
          console.log(`✅ Found contact info link: ${selector}`);
          break;
        }
      }

      if (contactLink) {
        // Click the contact info link
        contactLink.click();
        await this.wait(500);

        // Wait for the modal to appear and be visible
        let modal = null;
        for (let i = 0; i < 10; i++) { // up to 2s
          modal = document.querySelector('.artdeco-modal[role="dialog"]');
          if (modal && modal.offsetParent !== null) break;
          await this.wait(200);
        }
        if (!modal || modal.offsetParent === null) {
          console.log('⚠️ Contact info modal not found or not visible.');
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
          console.log(`✅ Found email: ${email}`);
        }
        if (!foundEmail) {
          console.log('⚠️ Email not found in modal. Modal content HTML:', modalContent.innerHTML?.slice(0, 1000));
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
          console.log(`✅ Found website: ${website}`);
        }
        if (!foundWebsite) {
          console.log('⚠️ Website not found in modal. Modal content HTML:', modalContent.innerHTML?.slice(0, 1000));
        }

        // Extract phone (if present)
        let foundPhone = false;
        const phoneElement = modalContent.querySelector('span[aria-label*="phone"], .ci-phone, .contact-info .ci-phone, .pv-contact-info__contact-type.ci-phone span.t-14');
        if (phoneElement && phoneElement.textContent?.trim()) {
          const phone = phoneElement.textContent.trim();
          personalInfo.phone = phone;
          foundPhone = true;
          console.log(`✅ Found phone: ${phone}`);
        }
        if (!foundPhone) {
          console.log('⚠️ Phone not found in modal. Modal content HTML:', modalContent.innerHTML?.slice(0, 1000));
        }

        // Close contact info modal if open
        const closeButton = modal.querySelector('button[aria-label*="Dismiss"], .artdeco-modal__dismiss');
        if (closeButton) {
          closeButton.click();
          await this.wait(500);
        }
      } else {
        console.log('⚠️ Contact info link not found');
      }

    } catch (error) {
      console.error('❌ Failed to extract contact info:', error);
    }
    
    return personalInfo; // Always return the personalInfo object
  }

  async extractSummary() {
    console.log('📝 Extracting summary/about...');

    try {
      // First, look for the About section
      const aboutSection = document.querySelector('#about');
      if (!aboutSection) {
        console.log('⚠️ About section not found');
        return '';
      }

      console.log('✅ About section found, scrolling to it...');
      
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
          console.log(`✅ Found about content with selector: ${selector}`);
          console.log('📍 About content HTML preview:', aboutContent.innerHTML.substring(0, 300) + '...');
          
          // Skip if this looks like a header container (has h2 but minimal text)
          const hasHeader = aboutContent.querySelector('h2, h3, h4');
          const textContent = aboutContent.textContent.trim();
          if (hasHeader && textContent.length < 100) {
            console.log('⚠️ Skipping header container, looking for actual content...');
            continue;
          }
          
          // Click "see more" if present
          const seeMoreButton = aboutContent.querySelector('button[aria-label*="see more"], .inline-show-more-text__button, button[aria-expanded="false"]');
          if (seeMoreButton) {
            try {
              console.log('🔍 Found "see more" button, clicking...');
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
              const summaryText = textElement.textContent.trim();
              if (summaryText && summaryText.length > 50) { // Reduced length requirement
                console.log(`✅ Found summary with ${textSelector}: ${summaryText.substring(0, 100)}...`);
                return summaryText;
              }
            }
          }

          // If no text found in nested elements, try the content directly
          const directText = aboutContent.textContent.trim();
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
          const textContent = currentElement.textContent.trim();
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
    console.log('🛠️ Extracting skills...');

    const skills = [];

    try {
      // Look for skills section
      const skillsSection = document.querySelector('#skills');
      if (!skillsSection) {
        console.log('⚠️ Skills section not found');
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
            console.log(`🎯 Found skills expand button: ${selector}`);
            expandButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);
            expandButton.click();
            await this.wait(3000); // Longer wait for skills to load
            foundExpandButton = true;
            break;
          }
        } catch (e) {
          console.log(`⚠️ Failed to expand skills with selector ${selector}:`, e.message);
        }
      }

      if (!foundExpandButton) {
        console.log('⚠️ No skills expand button found, proceeding with visible skills');
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
          console.log(`🔍 Found ${skillElements.length} skill elements with selector: ${selector}`);
          
          // Limit to avoid processing too many elements
          const elementsToProcess = Math.min(skillElements.length, 50);
          
          for (let i = 0; i < elementsToProcess; i++) {
            const skillEl = skillElements[i];
            if (skillEl && skillEl.textContent?.trim()) {
              const skillText = skillEl.textContent.trim();
              
              // Validate skill text
              if (this.isValidSkill(skillText)) {
                extractedSkills.add(skillText);
                console.log(`✅ Found skill: ${skillText}`);
              }
            }
          }
          
          // If we found skills with this selector, log and continue to get more
          if (extractedSkills.size > 0) {
            console.log(`✅ Extracted ${extractedSkills.size} skills so far with selector: ${selector}`);
          }
        }
      }

      // Convert Set back to Array
      skills.push(...Array.from(extractedSkills));

      console.log(`✅ Extracted ${skills.length} total skills`);

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
    console.log('🏆 Extracting certifications...');

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
            expandButton.click();
            await this.wait(2000);
            break;
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
              name: nameElement.textContent.trim(),
              issuer: issuerElement ? issuerElement.textContent.trim() : null
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
    console.log('💼 Extracting experience from LinkedIn profile...');

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
        .map(line => line.trim())
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
                 !lowerLine.includes('· ') && // Skip metadata with bullets
                 !lowerLine.match(/^(full-time|part-time|contract|freelance)$/); // Skip employment types
        });

      console.log(`📍 Filtered lines: ${lines.slice(0, 10).join(' | ')}`);

      // Improved parsing: Look for patterns that indicate job titles and companies
      for (let i = 0; i < lines.length - 1; i++) {
        const possibleTitle = lines[i];
        const possibleCompany = lines[i + 1];
        
        // Enhanced validation for job title and company pair
        if (this.isValidJobTitle(possibleTitle) && this.isValidCompanyName(possibleCompany)) {
          // Look for duration in nearby lines
          let dateRange = '';
          for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 3); j++) {
            if (this.looksLikeDateRange(lines[j])) {
              dateRange = lines[j];
              break;
            }
          }

          experiences.push({
            title: possibleTitle,
            company: possibleCompany,
            date_range: dateRange,
            location: '',
            description: `${possibleTitle} at ${possibleCompany}`
          });
          console.log(`✅ Found potential experience: "${possibleTitle}" at "${possibleCompany}" (${dateRange})`);
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
    console.log('🏗️ Attempting structured experience extraction...');

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
              // Try multiple extraction strategies for each element
              const extractedExp = this.extractExperienceFromElement(expEl);
              if (extractedExp) {
                experiences.push(extractedExp);
                console.log(`✅ Structured extraction: "${extractedExp.title}" at "${extractedExp.company}"`);
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
        lowerTitle.includes('yrs') ||
        lowerTitle.includes('mos') ||
        lowerTitle.includes('ago')) {
      return false;
    }

    return true;
  }

  isValidCompanyName(company) {
    if (!company || company.length < 2 || company.length > 100) return false;
    
    const lowerCompany = company.toLowerCase();
    
    // Skip common non-company patterns
    if (lowerCompany.match(/^\d{4}/) || // Starts with year
        lowerCompany.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/) || // Contains month
        lowerCompany.includes('full-time') ||
        lowerCompany.includes('part-time') ||
        lowerCompany.includes('contract') ||
        lowerCompany.includes('yrs') ||
        lowerCompany.includes('mos') ||
        lowerCompany.includes('ago') ||
        lowerCompany.includes('·')) {
      return false;
    }

    return true;
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

  async clickShowAllExperiences() {
    console.log('🔍 Looking for "Show all experiences" button...');
    
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
          console.log(`✅ Found show all button with selector: ${selector}`);
          try {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);
            button.click();
            await this.wait(2000); // Wait for content to load
            console.log('✅ Clicked show all experiences button');
            return true;
          } catch (clickError) {
            console.log(`⚠️ Failed to click button with selector ${selector}:`, clickError.message);
            // Continue to next selector
          }
        }
      }
      
      console.log('⚠️ No "Show all experiences" button found');
      return false;
    } catch (error) {
      console.error('❌ Failed to click show all experiences:', error);
      return false;
    }
  }

  extractExperienceFromElement(element) {
    console.log('🔍 Extracting experience from element...');
    
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
        const titleText = titleEl.textContent.trim();
        if (this.isValidJobTitle(titleText)) {
          title = titleText;
          console.log(`✅ Found title with selector "${sel}": ${title}`);
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
        const companyText = companyEl.textContent.trim();
        if (this.isValidCompanyName(companyText)) {
          company = companyText;
          console.log(`✅ Found company with selector "${sel}": ${company}`);
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
        const dateText = dateEl.textContent.trim();
        if (this.looksLikeDateRange(dateText)) {
          dateRange = dateText;
          console.log(`✅ Found date range with selector "${sel}": ${dateRange}`);
          break;
        }
      }
    }

    // Strategy 2: If structured approach fails, try text-based extraction
    if (!title || !company) {
      console.log('⚠️ Structured extraction failed, trying text-based approach...');
      const elementText = element.textContent || '';
      const lines = elementText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      
      for (let i = 0; i < lines.length - 1; i++) {
        if (!title && this.isValidJobTitle(lines[i])) {
          title = lines[i];
          console.log(`✅ Found title from text: ${title}`);
        }
        if (!company && this.isValidCompanyName(lines[i])) {
          company = lines[i];
          console.log(`✅ Found company from text: ${company}`);
        }
        if (title && company) break;
      }
    }

    // Return experience if we found both title and company
    if (title && company && title !== company) {
      return {
        title: title,
        company: company,
        date_range: dateRange,
        location: location,
        description: `${title} at ${company}`
      };
    }

    console.log('⚠️ Could not extract valid experience from element');
    return null;
  }

  async extractEducationBasic() {
    console.log('🎓 Extracting basic education info...');

    const educations = [];

    try {
      // Look for education section
      const eduSection = document.querySelector('#education, .education-section');
      if (!eduSection) {
        console.log('⚠️ Education section not found');
        return educations;
      }

      // Extract basic education info
      const eduElements = eduSection.querySelectorAll('.pvs-list__item--line-separated, .pvs-entity');

      for (const edu of eduElements) {
        try {
          const schoolElement = edu.querySelector('.pvs-entity__path-node, .education-item__school');
          const degreeElement = edu.querySelector('.pvs-entity__path-node + span, .education-item__degree');

          if (schoolElement) {
            const eduData = {
              school: schoolElement.textContent.trim(),
              degree: degreeElement ? degreeElement.textContent.trim() : null
            };

            if (eduData.school && eduData.school.length > 2) {
              educations.push(eduData);
            }
          }
        } catch (e) {
          console.log(`⚠️ Failed to parse education:`, e.message);
        }
      }

      console.log(`✅ Extracted ${educations.length} basic education entries`);

    } catch (error) {
      console.error('❌ Failed to extract education:', error);
    }

    return educations;
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
          console.log(`📦 Found experience container with selector "${selector}"`);
          console.log(`   - Text preview: "${container.textContent?.substring(0, 150)}..."`);
          console.log(`   - Child elements: ${container.children.length}`);
          console.log(`   - Has .pvs-list__item--line-separated: ${container.querySelectorAll('.pvs-list__item--line-separated').length}`);
          console.log(`   - Has .pvs-entity__path-node: ${container.querySelectorAll('.pvs-entity__path-node').length}`);
        }
      }
      
      // Check for "Show all experiences" buttons
      const showAllButtons = document.querySelectorAll('button[aria-label*="Show"], a[href*="experience"]');
      console.log(`🔍 Found ${showAllButtons.length} potential "Show all" buttons`);
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
    allPathNodes.slice(0, 5).forEach((node, i) => {
      console.log(`   Path node ${i}: "${node.textContent?.trim()}"`);
    });

    return sections;
  }
}