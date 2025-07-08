// LinkedIn Profile Data Extractor
export class LinkedInExtractor {
  constructor() {
    this.isLinkedInPage = this.checkIfLinkedInPage();
    this.expansionAttempts = 0;
    this.maxExpansionAttempts = 3;
  }

  checkIfLinkedInPage() {
    return window.location.hostname.includes('linkedin.com');
  }

  async extractProfileData() {
    if (!this.isLinkedInPage) {
      throw new Error('Not on LinkedIn page');
    }

    console.log('🔍 Extracting LinkedIn profile data with backend parser...');

    try {
      // Step 1: Scroll to load all sections
      await this.scrollToLoadAllSections();

      // Step 2: Expand all collapsible content
      await this.expandAllSections();

      // Step 3: Extract all profile content as text
      const profileText = await this.extractProfileAsText();

      // Step 4: Send to backend parser
      const parsedData = await this.parseWithBackend(profileText);

      console.log('✅ LinkedIn profile data extracted successfully');
      console.log('📊 Extraction Summary:', {
        personal: Object.keys(parsedData.personal || {}).length,
        summary: parsedData.summary?.length || 0,
        experience: parsedData.experience?.length || 0,
        education: parsedData.education?.length || 0,
        skills: parsedData.skills?.length || 0,
        projects: parsedData.projects?.length || 0,
        languages: parsedData.languages?.length || 0,
        certifications: parsedData.certifications?.length || 0
      });

      return parsedData;

    } catch (error) {
      console.error('❌ Failed to extract LinkedIn data:', error);
      throw error;
    }
  }

  async extractProfileAsText() {
    console.log('📝 Extracting LinkedIn profile as text...');
    await this.wait(2000);

    // Get the entire main profile content
    const mainContent = document.querySelector('main, .scaffold-layout__main, .pv-top-card');
    if (!mainContent) {
      throw new Error('Could not find main profile content');
    }

    // Extract all text content
    let profileText = mainContent.textContent || mainContent.innerText || '';

    // Clean up the text - remove common LinkedIn UI noise
    profileText = profileText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/Contact info\s*\d+\s*connections?/gi, '') // Remove connection info
      .replace(/Open to\s*work/gi, '') // Remove "Open to work" text
      .replace(/Add profile section/gi, '') // Remove UI elements
      .replace(/Enhance profile/gi, '') // Remove UI elements
      .replace(/Resources/gi, '') // Remove navigation
      .replace(/Send profile in a message/gi, '') // Remove UI elements
      .replace(/Save to PDF/gi, '') // Remove UI elements
      .replace(/Saved items/gi, '') // Remove UI elements
      .replace(/Activity/gi, '') // Remove UI elements
      .replace(/Analytics.*?Private to you/gi, '') // Remove analytics section
      .replace(/\d+\s*profile views/gi, '') // Remove view counts
      .replace(/\d+\s*post impressions/gi, '') // Remove impression counts
      .replace(/\d+\s*search appearances/gi, '') // Remove search counts
      .replace(/Show all analytics/gi, '') // Remove analytics UI
      .replace(/Show details/gi, '') // Remove UI elements
      .replace(/Edit/gi, '') // Remove edit buttons
      .replace(/Tell non-profits.*?Get started/gi, '') // Remove non-profit section
      .replace(/Show all posts/gi, '') // Remove UI elements
      .replace(/Create a post/gi, '') // Remove UI elements
      .replace(/Posts Comments Images/gi, '') // Remove UI elements
      .replace(/Load more/gi, '') // Remove UI elements
      .replace(/Show all/gi, '') // Remove UI elements
      .replace(/Following/gi, '') // Remove following text
      .replace(/\d+,\d+\s*followers/gi, '') // Remove follower counts
      .replace(/Companies Schools/gi, '') // Remove UI elements
      .replace(/Show all companies/gi, '') // Remove UI elements
      .replace(/Show all 6 projects/gi, '') // Remove UI elements
      .replace(/Show all 49 skills/gi, '') // Remove UI elements
      .replace(/Show all 3 languages/gi, '') // Remove UI elements
      .replace(/Associated with.*?Given for/gi, '') // Remove award descriptions
      .replace(/About this profile/gi, '') // Remove UI elements
      .replace(/Open to/gi, '') // Remove UI elements
      .replace(/Add profile section/gi, '') // Remove UI elements
      .replace(/Enhance profile/gi, '') // Remove UI elements
      .replace(/Resources/gi, '') // Remove UI elements
      .replace(/Send profile in a message/gi, '') // Remove UI elements
      .replace(/Save to PDF/gi, '') // Remove UI elements
      .replace(/Saved items/gi, '') // Remove UI elements
      .replace(/Activity/gi, '') // Remove UI elements
      .replace(/Analytics.*?Private to you/gi, '') // Remove analytics section
      .replace(/\d+\s*profile views/gi, '') // Remove view counts
      .replace(/\d+\s*post impressions/gi, '') // Remove impression counts
      .replace(/\d+\s*search appearances/gi, '') // Remove search counts
      .replace(/Show all analytics/gi, '') // Remove analytics UI
      .replace(/Show details/gi, '') // Remove UI elements
      .replace(/Edit/gi, '') // Remove edit buttons
      .replace(/Tell non-profits.*?Get started/gi, '') // Remove non-profit section
      .replace(/Show all posts/gi, '') // Remove UI elements
      .replace(/Create a post/gi, '') // Remove UI elements
      .replace(/Posts Comments Images/gi, '') // Remove UI elements
      .replace(/Load more/gi, '') // Remove UI elements
      .replace(/Show all/gi, '') // Remove UI elements
      .replace(/Following/gi, '') // Remove following text
      .replace(/\d+,\d+\s*followers/gi, '') // Remove follower counts
      .replace(/Companies Schools/gi, '') // Remove UI elements
      .replace(/Show all companies/gi, '') // Remove UI elements
      .replace(/Show all 6 projects/gi, '') // Remove UI elements
      .replace(/Show all 49 skills/gi, '') // Remove UI elements
      .replace(/Show all 3 languages/gi, '') // Remove UI elements
      .replace(/Associated with.*?Given for/gi, '') // Remove award descriptions
      .trim();

    // Split into lines and identify sections
    const lines = profileText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Reconstruct with section headers
    let structuredText = '';
    let currentSection = '';

    for (const line of lines) {
      const lineLower = line.toLowerCase();

      // Identify section headers
      if (lineLower.includes('experience') || lineLower.includes('work')) {
        currentSection = 'EXPERIENCE';
        structuredText += '\n' + currentSection + '\n';
        continue;
      }

      if (lineLower.includes('education') || lineLower.includes('university') || lineLower.includes('college')) {
        currentSection = 'EDUCATION';
        structuredText += '\n' + currentSection + '\n';
        continue;
      }

      if (lineLower.includes('skills') || lineLower.includes('technologies')) {
        currentSection = 'SKILLS';
        structuredText += '\n' + currentSection + '\n';
        continue;
      }

      if (lineLower.includes('projects') || lineLower.includes('portfolio')) {
        currentSection = 'PROJECTS';
        structuredText += '\n' + currentSection + '\n';
        continue;
      }

      if (lineLower.includes('certifications') || lineLower.includes('licenses')) {
        currentSection = 'CERTIFICATIONS';
        structuredText += '\n' + currentSection + '\n';
        continue;
      }

      if (lineLower.includes('languages')) {
        currentSection = 'LANGUAGES';
        structuredText += '\n' + currentSection + '\n';
        continue;
      }

      if (lineLower.includes('about') || lineLower.includes('summary')) {
        currentSection = 'SUMMARY';
        structuredText += '\n' + currentSection + '\n';
        continue;
      }

      // Add the line to the current section
      if (line.length > 0) {
        structuredText += line + '\n';
      }
    }

    // Clean up the final text
    structuredText = structuredText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .replace(/\s{2,}/g, ' ')
      .trim();

    console.log(`📄 Extracted ${structuredText.length} characters of profile text`);
    console.log('📄 First 500 characters:', structuredText.substring(0, 500));

    return structuredText;
  }

  async parseWithBackend(profileText) {
    console.log('🔧 Sending profile text to backend parser...');

    try {
      // Send profile text as JSON to the LinkedIn parser endpoint
      const response = await fetch('http://localhost:3000/linkedin/parse_api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_text: profileText
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to parse LinkedIn profile');
      }

      console.log('✅ Backend parsing successful');
      return result.data;

    } catch (error) {
      console.error('❌ Backend parsing failed:', error);

      // Fallback to local parsing if backend fails
      console.log('🔄 Falling back to local parsing...');
      return this.parseLocally(profileText);
    }
  }

  async parseLocally(profileText) {
    console.log('🔍 Parsing LinkedIn profile locally...');

    const profileData = {
      personal: {},
      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      languages: [],
      certifications: []
    };

    try {
      // Extract personal info
      await this.extractPersonalInfo(profileData);

      // Extract summary
      await this.extractSummary(profileData);

      // Parse text content for other sections
      const lines = profileText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      // Parse experience from text
      profileData.experience = this.parseExperienceFromText(lines);

      // Parse education from text
      profileData.education = this.parseEducationFromText(lines);

      // Parse skills from text
      profileData.skills = this.parseSkillsFromText(lines);

      // Parse projects from text
      profileData.projects = this.parseProjectsFromText(lines);

      // Parse languages from text
      profileData.languages = this.parseLanguagesFromText(lines);

      // Parse certifications from text
      profileData.certifications = this.parseCertificationsFromText(lines);

      console.log('✅ Local parsing completed');
      return profileData;

    } catch (error) {
      console.error('❌ Local parsing failed:', error);
      throw error;
    }
  }

  async extractPersonalInfo(profileData) {
    try {
      console.log('👤 Extracting personal info with modern selectors...');

      // Name - Updated selectors for 2024 LinkedIn
      const nameSelectors = [
        'h1.text-heading-xlarge',
        'h1[data-generated-suggestion-target]',
        '.pv-text-details__left-panel h1',
        '.ph5 h1',
        '.pv-top-card .pv-top-card__information h1',
        'main h1',
        '.scaffold-layout__main h1'
      ];

      for (const selector of nameSelectors) {
        const nameElement = document.querySelector(selector);
        if (nameElement && nameElement.textContent.trim()) {
          const fullName = nameElement.textContent.trim();
          profileData.personal.full_name = fullName;

          const nameParts = fullName.split(' ').filter(part => part.length > 0);
          if (nameParts.length >= 2) {
            profileData.personal.first_name = nameParts[0];
            profileData.personal.last_name = nameParts[nameParts.length - 1];
          } else if (nameParts.length === 1) {
            profileData.personal.first_name = nameParts[0];
          }
          console.log(`✅ Found name: ${fullName}`);
          break;
        }
      }

      // Profile headline - Updated selectors
      const headlineSelectors = [
        '.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium',
        '.ph5 .text-body-medium',
        '.pv-top-card .pv-top-card__information .text-body-medium',
        '.scaffold-layout__main .text-body-medium',
        'main .text-body-medium'
      ];

      for (const selector of headlineSelectors) {
        const headlineElement = document.querySelector(selector);
        if (headlineElement && headlineElement.textContent.trim()) {
          const headline = headlineElement.textContent.trim();
          // Skip if this looks like a name instead of headline
          if (!headline.includes(profileData.personal.full_name || '')) {
            profileData.personal.headline = headline;
            console.log(`✅ Found headline: ${headline.substring(0, 50)}...`);
            break;
          }
        }
      }

      // Location - Updated selectors
      const locationSelectors = [
        '.text-body-small.inline.t-black--light.break-words',
        '.pv-text-details__left-panel .text-body-small',
        '.ph5 .text-body-small',
        '.pv-top-card .pv-top-card__information .text-body-small',
        '.scaffold-layout__main .text-body-small',
        'main .text-body-small'
      ];

      for (const selector of locationSelectors) {
        const locationElement = document.querySelector(selector);
        if (locationElement && locationElement.textContent.trim()) {
          const location = locationElement.textContent.trim();
          // Basic validation that this looks like a location
          if (location.length < 100 && !location.includes('@') && !location.includes('http')) {
            profileData.personal.location = location;
            console.log(`✅ Found location: ${location}`);
            break;
          }
        }
      }

      // Contact info (usually requires clicking contact info button)
      const contactSelectors = [
        '#top-card-text-details-contact-info',
        '.pv-contact-info',
        '.pv-top-card__contact-info',
        '[data-control-name="contact_see_more"]'
      ];

      for (const selector of contactSelectors) {
        const contactSection = document.querySelector(selector);
        if (contactSection) {
          // Email
          const emailElement = contactSection.querySelector('a[href^="mailto:"]');
          if (emailElement) {
            profileData.personal.email = emailElement.href.replace('mailto:', '');
            console.log(`✅ Found email: ${profileData.personal.email}`);
          }

          // Phone
          const phoneElement = contactSection.querySelector('span[aria-label*="phone"], .ci-phone');
          if (phoneElement) {
            profileData.personal.phone = phoneElement.textContent.trim();
            console.log(`✅ Found phone: ${profileData.personal.phone}`);
          }
          break;
        }
      }

      // LinkedIn URL
      profileData.personal.linkedin = window.location.href.split('?')[0];

      console.log('✅ Extracted personal info from LinkedIn');
    } catch (error) {
      console.warn('⚠️ Failed to extract personal info:', error);
    }
  }

  async extractSummary(profileData) {
    try {
      console.log('📝 Extracting summary with modern selectors...');

      // About section - Updated selectors for 2024
      const aboutSelectors = [
        '#about ~ .pv-shared-text-with-see-more',
        '.pv-about-section .pv-about__summary-text',
        '.pv-oc .pv-about-section',
        '[data-test-id="about-section"]',
        '.scaffold-layout__main section[data-section="summary"]',
        '.about-section'
      ];

      for (const selector of aboutSelectors) {
        const aboutSection = document.querySelector(selector);
        if (aboutSection) {
          // Click "see more" if present
          const seeMoreButton = aboutSection.querySelector('button[aria-label*="see more"], .inline-show-more-text__button, button[aria-expanded="false"]');
          if (seeMoreButton) {
            try {
              seeMoreButton.click();
              await new Promise(resolve => setTimeout(resolve, 500));
              console.log('✅ Expanded about section');
            } catch (e) {
              console.log('⚠️ Could not expand about section');
            }
          }

          // Extract text content
          const textElement = aboutSection.querySelector('span[aria-hidden="true"], .inline-show-more-text span, .pv-about__summary-text');
          if (textElement) {
            const summaryText = textElement.textContent.trim();
            if (summaryText && summaryText.length > 20) {
              profileData.summary = summaryText;
              console.log(`✅ Found summary: ${summaryText.substring(0, 100)}...`);
              break;
            }
          }
        }
      }

      console.log('✅ Extracted summary from LinkedIn');
    } catch (error) {
      console.warn('⚠️ Failed to extract summary:', error);
    }
  }

  // Enhanced expansion methods
  async expandAllSections() {
    console.log('🔄 Expanding all collapsible sections...');

    // Expand skills first (most important)
    await this.expandSkillsSection();

    // Expand other sections
    await this.expandSection('experience', '#experience');
    await this.expandSection('education', '#education');
    await this.expandSection('projects', '#projects');
    await this.expandSection('languages', '#languages');
    await this.expandSection('certifications', '#licenses_and_certifications');

    console.log('✅ Section expansion completed');
  }

  async expandSkillsSection() {
    console.log('🛠️ Expanding skills section...');

    try {
      // Look for skills section
      const skillsSection = document.querySelector('#skills');
      if (!skillsSection) {
        console.log('⚠️ Skills section not found');
        return;
      }

      // Scroll to skills section
      skillsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(1000);

      // Look for "Show all X skills" button patterns
      const skillsExpandButtons = [
        'button[aria-label*="Show all"][aria-label*="skill"]',
        'button[aria-label*="skills"][aria-label*="Show"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button',
        'button[data-control-name="skill_details"]',
        '.skills-section button[aria-expanded="false"]'
      ];

      let skillsExpanded = false;
      for (const selector of skillsExpandButtons) {
        try {
          const expandButton = skillsSection.querySelector(selector) ||
                              document.querySelector(`#skills ~ * ${selector}`);

          if (expandButton && expandButton.offsetParent !== null) {
            console.log(`🎯 Found skills expand button: ${selector}`);

            // Scroll button into view and click
            expandButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);

            await this.clickWithRetry(expandButton, 'Skills expand button');
            await this.wait(2000); // Wait for skills to load

            skillsExpanded = true;
            break;
          }
        } catch (e) {
          console.log(`⚠️ Failed to expand skills with selector ${selector}:`, e.message);
        }
      }

      // Alternative: Look for specific text patterns
      if (!skillsExpanded) {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const skillButtons = allButtons.filter(btn => {
          const text = btn.textContent.toLowerCase();
          return (text.includes('show all') && text.includes('skill')) ||
                 (text.includes('show') && text.includes('more') && text.includes('skill'));
        });

        for (const button of skillButtons) {
          try {
            console.log(`🎯 Found skills button by text: "${button.textContent}"`);
            await this.clickWithRetry(button, 'Skills button (by text)');
            await this.wait(2000);
            skillsExpanded = true;
            break;
          } catch (e) {
            console.log('⚠️ Failed to click skills button:', e.message);
          }
        }
      }

      if (skillsExpanded) {
        console.log('✅ Skills section expanded successfully');
      } else {
        console.log('⚠️ No skills expansion button found - may already be fully expanded');
      }

    } catch (error) {
      // Handle DOM exceptions gracefully - these are expected on some LinkedIn layouts
      if (error.name === 'DOMException' || error instanceof DOMException) {
        console.log('ℹ️ DOM access limited for skills section (expected on some LinkedIn layouts)');
      } else {
        console.warn('⚠️ Failed to expand skills section:', error);
      }
    }
  }

  async expandSection(sectionName, sectionId) {
    console.log(`🔄 Expanding ${sectionName} section...`);

    try {
      const section = document.querySelector(sectionId);
      if (!section) {
        console.log(`⚠️ ${sectionName} section not found`);
        return;
      }

      // Scroll to section
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(500);

      // Find and click "see more" buttons in this section
      const seeMoreSelectors = [
        'button[aria-label*="see more"]',
        'button[aria-label*="Show more"]',
        '.inline-show-more-text__button',
        '.pv-shared-text-with-see-more button',
        '.pvs-list__see-more-button',
        'button[data-control-name*="see_more"]'
      ];

      let expandedCount = 0;
      const sectionContainer = section.parentElement;

      // First try CSS selectors
      for (const selector of seeMoreSelectors) {
        const buttons = sectionContainer.querySelectorAll(selector);

        for (const button of buttons) {
          if (button.offsetParent !== null && !button.disabled) {
            try {
              console.log(`🎯 Expanding content in ${sectionName} section`);
              button.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await this.wait(300);

              await this.clickWithRetry(button, `${sectionName} see more`);
              await this.wait(1000);
              expandedCount++;
            } catch (e) {
              console.log(`⚠️ Failed to expand content in ${sectionName}:`, e.message);
            }
          }
        }
      }

      // Alternative: Look for buttons by text content
      const allButtons = Array.from(sectionContainer.querySelectorAll('button'));
      const textBasedButtons = allButtons.filter(btn => {
        const text = btn.textContent.toLowerCase();
        return text.includes('see more') || text.includes('show more');
      });

      for (const button of textBasedButtons) {
        if (button.offsetParent !== null && !button.disabled) {
          try {
            console.log(`🎯 Expanding content in ${sectionName} section (by text)`);
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(300);

            await this.clickWithRetry(button, `${sectionName} see more (by text)`);
            await this.wait(1000);
            expandedCount++;
          } catch (e) {
            console.log(`⚠️ Failed to expand content in ${sectionName} by text:`, e.message);
          }
        }
      }

      if (expandedCount > 0) {
        console.log(`✅ Expanded ${expandedCount} items in ${sectionName} section`);
      }

    } catch (error) {
      // Handle DOM exceptions gracefully - these are expected on some LinkedIn layouts
      if (error.name === 'DOMException' || error instanceof DOMException) {
        console.log(`ℹ️ DOM access limited for ${sectionName} section (expected on some LinkedIn layouts)`);
      } else {
        console.warn(`⚠️ Failed to expand ${sectionName} section:`, error);
      }
    }
  }

  async clickWithRetry(element, description, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (element.offsetParent === null) {
          throw new Error('Element not visible');
        }

        // Try different click methods
        if (i === 0) {
          element.click();
        } else if (i === 1) {
          element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        } else {
          // Force click using JavaScript
          element.click();
          element.dispatchEvent(new Event('click', { bubbles: true }));
        }

        console.log(`✅ Successfully clicked: ${description}`);
        return true;

      } catch (error) {
        console.log(`⚠️ Click attempt ${i + 1} failed for ${description}:`, error.message);
        if (i < maxRetries - 1) {
          await this.wait(500);
        }
      }
    }

    console.log(`❌ All click attempts failed for: ${description}`);
    return false;
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

  // Text parsing methods
  parseExperienceFromText(lines) {
    const experiences = [];
    let currentExperience = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for job titles (usually in bold or prominent)
      if (line.length > 3 && line.length < 100 && !line.match(/^\d{4}/) && !line.includes('•')) {
        if (!currentExperience.title) {
          currentExperience.title = line;
          continue;
        }
      }

      // Look for company names
      if (line.length > 2 && line.length < 80 && !line.match(/^\d{4}/) && !line.includes('•')) {
        if (!currentExperience.company && line !== currentExperience.title) {
          currentExperience.company = line;
          continue;
        }
      }

      // Look for dates/duration
      if (line.match(/\d{4}/) || line.match(/\d+\s+(year|month|yr|mo)/i)) {
        if (!currentExperience.dates) {
          currentExperience.dates = line;
          continue;
        }
      }

      // Look for descriptions (longer text)
      if (line.length > 50 && !line.match(/^\d{4}/)) {
        if (!currentExperience.description) {
          currentExperience.description = line;
        } else {
          currentExperience.description += ' ' + line;
        }
      }

      // If we have a title and company, save the experience
      if (currentExperience.title && currentExperience.company && Object.keys(currentExperience).length >= 2) {
        experiences.push({...currentExperience});
        currentExperience = {};
      }
    }

    // Add the last experience if it has content
    if (currentExperience.title && currentExperience.company) {
      experiences.push(currentExperience);
    }

    return experiences;
  }

  parseEducationFromText(lines) {
    const education = [];
    let currentEducation = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for school names
      if (line.length > 3 && line.length < 100 && !line.match(/^\d{4}/)) {
        if (!currentEducation.school) {
          currentEducation.school = line;
          continue;
        }
      }

      // Look for degrees
      if (line.length > 5 && line.length < 150 && !line.match(/^\d{4}/)) {
        if (!currentEducation.degree && line !== currentEducation.school) {
          currentEducation.degree = line;
          continue;
        }
      }

      // Look for years
      if (line.match(/^\d{4}/)) {
        if (!currentEducation.year) {
          currentEducation.year = line;
        }
      }

      // If we have a school and degree, save the education
      if (currentEducation.school && currentEducation.degree && Object.keys(currentEducation).length >= 2) {
        education.push({...currentEducation});
        currentEducation = {};
      }
    }

    // Add the last education if it has content
    if (currentEducation.school && currentEducation.degree) {
      education.push(currentEducation);
    }

    return education;
  }

  parseSkillsFromText(lines) {
    const skills = [];

    for (const line of lines) {
      // Clean up the line
      let skill = line.replace(/^\d+\s+/, ''); // Remove leading numbers
      skill = skill.replace(/\s+\d+$/, ''); // Remove trailing numbers
      skill = skill.replace(/endorsements?$/i, ''); // Remove "endorsements"
      skill = skill.trim();

      // Validate skill
      if (skill &&
          skill.length > 1 &&
          skill.length < 60 &&
          !skill.match(/^\d+$/) &&
          !skill.toLowerCase().includes('endorsement') &&
          !skill.toLowerCase().includes('connection') &&
          !skill.toLowerCase().includes('see more') &&
          !skill.toLowerCase().includes('show all')) {
        skills.push(skill);
      }
    }

    return skills;
  }

  parseProjectsFromText(lines) {
    const projects = [];
    let currentProject = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for project names
      if (line.length > 3 && line.length < 100 && !line.match(/^\d{4}/)) {
        if (!currentProject.name) {
          currentProject.name = line;
          continue;
        }
      }

      // Look for descriptions
      if (line.length > 20 && !line.match(/^\d{4}/)) {
        if (!currentProject.description && line !== currentProject.name) {
          currentProject.description = line;
        } else if (currentProject.description) {
          currentProject.description += ' ' + line;
        }
      }

      // If we have a name, save the project
      if (currentProject.name && Object.keys(currentProject).length >= 1) {
        projects.push({...currentProject});
        currentProject = {};
      }
    }

    // Add the last project if it has content
    if (currentProject.name) {
      projects.push(currentProject);
    }

    return projects;
  }

  parseLanguagesFromText(lines) {
    const languages = [];

    for (const line of lines) {
      const language = line.trim();

      if (language &&
          language.length > 1 &&
          language.length < 50 &&
          !language.match(/^\d+$/) &&
          !language.toLowerCase().includes('see more')) {
        languages.push({ language: language });
      }
    }

    return languages;
  }

  parseCertificationsFromText(lines) {
    const certifications = [];
    let currentCert = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for certification names
      if (line.length > 3 && line.length < 100 && !line.match(/^\d{4}/)) {
        if (!currentCert.name) {
          currentCert.name = line;
          continue;
        }
      }

      // Look for issuers
      if (line.length > 2 && line.length < 80 && !line.match(/^\d{4}/)) {
        if (!currentCert.issuer && line !== currentCert.name) {
          currentCert.issuer = line;
          continue;
        }
      }

      // Look for years
      if (line.match(/^\d{4}/)) {
        if (!currentCert.year) {
          currentCert.year = line;
        }
      }

      // If we have a name, save the certification
      if (currentCert.name && Object.keys(currentCert).length >= 1) {
        certifications.push({...currentCert});
        currentCert = {};
      }
    }

    // Add the last certification if it has content
    if (currentCert.name) {
      certifications.push(currentCert);
    }

    return certifications;
  }
}
