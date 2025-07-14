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
        personal_info: personalInfo,
        summary: summary,
        work_experience: experiences,
        education: educations,
        skills: skills,
        projects: [],
        languages: [],
        certifications: certifications
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

    // Name - Using the scraper's specific XPath approach
    const nameSelectors = [
      "//*[@class='mt2 relative']//h1",
      "//*[@class='pv-top-card']//h1",
      "//*[@class='text-heading-xlarge']",
      "//main//h1",
      "//*[@class='scaffold-layout__main']//h1",
      "h1.text-heading-xlarge",
      "h1[data-generated-suggestion-target]",
      ".pv-text-details__left-panel h1",
      ".ph5 h1",
      ".pv-top-card .pv-top-card__information h1",
      "main h1",
      ".scaffold-layout__main h1",
      ".text-heading-xlarge",
      ".pv-top-card h1",
      "h1"
    ];

    for (const selector of nameSelectors) {
      let nameEl;
      try {
        if (selector.startsWith('//')) {
          // XPath selector
          nameEl = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } else {
          // CSS selector
          nameEl = document.querySelector(selector);
        }
      } catch (error) {
        console.log(`⚠️ Failed to evaluate selector "${selector}":`, error.message);
        continue;
      }

      if (nameEl && nameEl.textContent?.trim()) {
        const fullName = nameEl.textContent.trim();
        personalInfo.full_name = fullName;

        const nameParts = fullName.split(' ').filter(part => part.length > 0);
        if (nameParts.length >= 2) {
          personalInfo.first_name = nameParts[0];
          personalInfo.last_name = nameParts[nameParts.length - 1];
        } else if (nameParts.length === 1) {
          personalInfo.first_name = nameParts[0];
        }
        console.log(`✅ Found name: ${fullName}`);
        break;
      }
    }

    // Headline - Using the scraper's approach
    const headlineSelectors = [
      "//*[@class='text-body-medium break-words']",
      "//*[@class='pv-text-details__left-panel']//*[@class='text-body-medium']",
      "//*[@class='ph5']//*[@class='text-body-medium']",
      "//*[@class='pv-top-card']//*[@class='text-body-medium']",
      "//*[@class='scaffold-layout__main']//*[@class='text-body-medium']",
      "//main//*[@class='text-body-medium']",
      ".text-body-medium.break-words",
      ".pv-text-details__left-panel .text-body-medium",
      ".ph5 .text-body-medium",
      ".pv-top-card .pv-top-card__information .text-body-medium",
      ".scaffold-layout__main .text-body-medium",
      "main .text-body-medium",
      ".pv-top-card .text-body-medium"
    ];

    for (const selector of headlineSelectors) {
      let headlineEl;
      try {
        if (selector.startsWith('//')) {
          headlineEl = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } else {
          headlineEl = document.querySelector(selector);
        }
      } catch (error) {
        console.log(`⚠️ Failed to evaluate headline selector "${selector}":`, error.message);
        continue;
      }

      if (headlineEl && headlineEl.textContent?.trim()) {
        const headline = headlineEl.textContent.trim();
        // Skip if this looks like a name instead of headline
        if (!headline.includes(personalInfo.full_name || '')) {
          personalInfo.headline = headline;
          console.log(`✅ Found headline: ${headline.substring(0, 50)}...`);
          break;
        }
      }
    }

    // Location - Using the scraper's specific XPath
    const locationSelectors = [
      "//*[@class='text-body-small inline t-black--light break-words']",
      "//*[@class='mt2 relative']//*[@class='text-body-small inline t-black--light break-words']",
      "//*[@class='pv-text-details__left-panel']//*[@class='text-body-small']",
      "//*[@class='ph5']//*[@class='text-body-small']",
      "//*[@class='pv-top-card']//*[@class='text-body-small']",
      "//*[@class='scaffold-layout__main']//*[@class='text-body-small']",
      "//main//*[@class='text-body-small']",
      ".text-body-small.inline.t-black--light.break-words",
      ".pv-text-details__left-panel .text-body-small",
      ".ph5 .text-body-small",
      ".pv-top-card .pv-top-card__information .text-body-small",
      ".scaffold-layout__main .text-body-small",
      "main .text-body-small",
      ".pv-top-card .text-body-small"
    ];

    for (const selector of locationSelectors) {
      let locationEl;
      try {
        if (selector.startsWith('//')) {
          locationEl = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } else {
          locationEl = document.querySelector(selector);
        }
      } catch (error) {
        console.log(`⚠️ Failed to evaluate location selector "${selector}":`, error.message);
        continue;
      }

      if (locationEl && locationEl.textContent?.trim()) {
        const location = locationEl.textContent.trim();
        // Basic validation that this looks like a location
        if (location.length < 100 && !location.includes('@') && !location.includes('http')) {
          personalInfo.location = location;
          console.log(`✅ Found location: ${location}`);
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
          return;
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
      await this.wait(1000);

      // Look for the content in the next sibling or within a container
      const aboutSelectors = [
        '#about + .pv-shared-text-with-see-more',
        '#about ~ .pv-shared-text-with-see-more',
        '#about + * .pv-shared-text-with-see-more',
        '#about ~ * .pv-shared-text-with-see-more',
        '#about + .pvs-list__outer-container',
        '#about ~ .pvs-list__outer-container',
        '#about + * .pvs-list__outer-container',
        '#about ~ * .pvs-list__outer-container',
        '#about + div',
        '#about ~ div',
        '#about + section',
        '#about ~ section'
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
      await this.wait(1000);

      // Look for "Show all X skills" button
      const skillsExpandButtons = [
        'button[aria-label*="Show all"][aria-label*="skill"]',
        'button[aria-label*="skills"][aria-label*="Show"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button',
        'button[data-control-name="skill_details"]',
        '.skills-section button[aria-expanded="false"]'
      ];

      for (const selector of skillsExpandButtons) {
        try {
          const expandButton = skillsSection.querySelector(selector) ||
                              document.querySelector(`#skills ~ * ${selector}`);

          if (expandButton && expandButton.offsetParent !== null) {
            console.log(`🎯 Found skills expand button: ${selector}`);
            expandButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);
            expandButton.click();
            await this.wait(2000);
            break;
          }
        } catch (e) {
          console.log(`⚠️ Failed to expand skills with selector ${selector}:`, e.message);
        }
      }

      // Extract skills
      const skillElements = skillsSection.querySelectorAll('.pvs-list__item--line-separated, .pvs-entity, .skill-item, .pvs-entity__path-node');

      for (const skill of skillElements) {
        const skillName = skill.querySelector('.pvs-entity__path-node, .skill-item__name, span');
        if (skillName) {
          const skillText = skillName.textContent.trim();
          if (skillText && skillText.length > 1 && skillText.length < 60) {
            skills.push(skillText);
          }
        }
      }

      console.log(`✅ Extracted ${skills.length} skills`);

    } catch (error) {
      console.error('❌ Failed to extract skills:', error);
    }

    return skills;
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
      await this.wait(1500); // Give more time to load

      // Get all text from the experience section and analyze it
      const experienceText = expSection.textContent || '';
      console.log(`📍 Experience section text (first 300 chars): ${experienceText.substring(0, 300)}...`);
      
      // Split into meaningful lines
      const lines = experienceText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2 && line.length < 150)
        .filter(line => 
          !line.includes('Experience') && // Skip section header
          !line.includes('Show all') && // Skip "Show all" buttons
          !line.includes('ago') && // Skip "2 months ago" type text
          !line.includes('connection') && // Skip connection text
          !line.includes('mutual') && // Skip mutual connections
          !line.match(/^\d+$/) && // Skip standalone numbers
          !line.includes('yrs') && // Skip "2 yrs" type text
          !line.includes('mos') // Skip "6 mos" type text
        );

      console.log(`📍 Filtered lines: ${lines.slice(0, 10).join(' | ')}`);

      // Simple approach: Look for pairs of lines that could be job title + company
      for (let i = 0; i < lines.length - 1; i++) {
        const possibleTitle = lines[i];
        const possibleCompany = lines[i + 1];
        
        // Basic validation for job title and company pair
        if (possibleTitle.length > 3 && possibleTitle.length < 80 &&
            possibleCompany.length > 3 && possibleCompany.length < 80 &&
            possibleTitle !== possibleCompany &&
            !possibleTitle.includes('·') && // Skip lines with metadata
            !possibleCompany.includes('Full-time') && // Skip employment type lines
            !possibleCompany.includes('Part-time')) {
          
          // Additional check: title shouldn't look like a date or duration
          if (!possibleTitle.match(/\d{4}/) && !possibleTitle.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i)) {
            experiences.push({
              title: possibleTitle,
              company: possibleCompany,
              date_range: '',
              location: '',
              description: `${possibleTitle} at ${possibleCompany}`
            });
            console.log(`✅ Found potential experience: "${possibleTitle}" at "${possibleCompany}"`);
          }
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

    // Scroll down gradually to trigger lazy loading
    const scrollSteps = 5;
    const scrollDelay = 1000;

    for (let i = 0; i < scrollSteps; i++) {
      const scrollPosition = (window.innerHeight * (i + 1));
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      await this.wait(scrollDelay);
    }

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await this.wait(1000);

    console.log('✅ Profile sections loaded');
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}