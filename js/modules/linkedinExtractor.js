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
        personal: personalInfo,
        summary: summary,
        experience: experiences,
        education: educations,
        skills: skills,
        projects: [],
        languages: [],
        certifications: certifications
      };

      console.log('✅ LinkedIn profile data extracted successfully');
      console.log('📊 Extraction Summary:', {
        personal: Object.keys(profileData.personal || {}).length,
        summary: profileData.summary?.length || 0,
        experience: profileData.experience?.length || 0,
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
      if (selector.startsWith('//')) {
        // XPath selector
        nameEl = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } else {
        // CSS selector
        nameEl = document.querySelector(selector);
      }

      if (nameEl && nameEl.textContent.trim()) {
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
      if (selector.startsWith('//')) {
        headlineEl = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } else {
        headlineEl = document.querySelector(selector);
      }

      if (headlineEl && headlineEl.textContent.trim()) {
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
      if (selector.startsWith('//')) {
        locationEl = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } else {
        locationEl = document.querySelector(selector);
      }

      if (locationEl && locationEl.textContent.trim()) {
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
    personalInfo.linkedin = window.location.href.split('?')[0];

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
        await this.wait(1000);

        // Wait for the modal to appear (up to 2s)
        let modal = null;
        const modalSelectors = [
          '.artdeco-modal',
          '.pv-contact-info',
          '.contact-info-modal',
          '.artdeco-modal__content'
        ];
        for (let i = 0; i < 10; i++) { // retry for up to 2s
          for (const selector of modalSelectors) {
            modal = document.querySelector(selector);
            if (modal && modal.offsetParent !== null) break;
          }
          if (modal && modal.offsetParent !== null) break;
          await this.wait(200);
        }
        if (!modal || modal.offsetParent === null) {
          console.log('⚠️ Contact info modal not found, using document');
          modal = document;
        }

        // Extract email
        let foundEmail = false;
        const emailSelectors = [
          'a[href^="mailto:"]',
          '.ci-email a',
          '.contact-info a[href^="mailto:"]'
        ];
        for (const selector of emailSelectors) {
          const emailElement = modal.querySelector(selector);
          if (emailElement) {
            const email = emailElement.href.replace('mailto:', '');
            personalInfo.email = email;
            foundEmail = true;
            console.log(`✅ Found email: ${email}`);
            break;
          }
        }
        if (!foundEmail) {
          console.log('⚠️ Email not found in modal. Modal HTML:', modal.innerHTML?.slice(0, 1000));
        }

        // Extract website
        let foundWebsite = false;
        const websiteSelectors = [
          'a[href^="http"]:not([href*="linkedin"])',
          '.ci-websites a',
          '.contact-info a[href^="http"]:not([href*="linkedin"])',
          '.pv-contact-info__contact-type.ci-websites a'
        ];
        for (const selector of websiteSelectors) {
          const websiteElement = modal.querySelector(selector);
          if (websiteElement) {
            const website = websiteElement.href;
            personalInfo.website = website;
            foundWebsite = true;
            console.log(`✅ Found website: ${website}`);
            break;
          }
        }
        if (!foundWebsite) {
          console.log('⚠️ Website not found in modal. Modal HTML:', modal.innerHTML?.slice(0, 1000));
        }

        // Extract phone
        let foundPhone = false;
        const phoneSelectors = [
          'span[aria-label*="phone"]',
          '.ci-phone',
          '.contact-info .ci-phone',
          '.pv-contact-info__contact-type.ci-phone span.t-14'
        ];
        for (const selector of phoneSelectors) {
          const phoneElement = modal.querySelector(selector);
          if (phoneElement) {
            const phone = phoneElement.textContent.trim();
            personalInfo.phone = phone;
            foundPhone = true;
            console.log(`✅ Found phone: ${phone}`);
            break;
          }
        }
        if (!foundPhone) {
          console.log('⚠️ Phone not found in modal. Modal HTML:', modal.innerHTML?.slice(0, 1000));
        }

        // Close contact info modal if open
        const closeButton = document.querySelector('button[aria-label*="Dismiss"], .artdeco-modal__dismiss');
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
      const aboutSelectors = [
        '#about ~ .pv-shared-text-with-see-more',
        '.pv-about-section .pv-about__summary-text',
        '.pv-oc .pv-about-section',
        '[data-test-id="about-section"]',
        '.scaffold-layout__main section[data-section="summary"]',
        '.about-section',
        '#about',
        '.pv-about__summary-text'
      ];

      for (const selector of aboutSelectors) {
        const aboutSection = document.querySelector(selector);
        if (aboutSection) {
          // Click "see more" if present
          const seeMoreButton = aboutSection.querySelector('button[aria-label*="see more"], .inline-show-more-text__button, button[aria-expanded="false"]');
          if (seeMoreButton) {
            try {
              seeMoreButton.click();
              await this.wait(500);
              console.log('✅ Expanded about section');
            } catch (e) {
              console.log('⚠️ Could not expand about section');
            }
          }

          // Extract text content
          const textElement = aboutSection.querySelector('span[aria-hidden="true"], .inline-show-more-text span, .pv-about__summary-text, p');
          if (textElement) {
            const summaryText = textElement.textContent.trim();
            if (summaryText && summaryText.length > 20) {
              console.log(`✅ Found summary: ${summaryText.substring(0, 100)}...`);
              return summaryText;
            }
          }
        }
      }

      console.log('⚠️ No summary found');
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
    console.log('💼 Extracting basic experience info...');

    const experiences = [];

    try {
      // Look for experience section
      const expSection = document.querySelector('#experience, .experience-section');
      if (!expSection) {
        console.log('⚠️ Experience section not found');
        return experiences;
      }

      // Scroll to experience section
      expSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(1000);

      // Look for "Show all" button
      const expandButtons = [
        'button[aria-label*="Show all"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button'
      ];

      for (const selector of expandButtons) {
        try {
          const expandButton = expSection.querySelector(selector);
          if (expandButton && expandButton.offsetParent !== null) {
            console.log(`🎯 Found experience expand button: ${selector}`);
            expandButton.click();
            await this.wait(2000);
            break;
          }
        } catch (e) {
          console.log(`⚠️ Failed to expand experience with selector ${selector}:`, e.message);
        }
      }

      // Extract basic experience info
      const expElements = expSection.querySelectorAll('.pvs-list__item--line-separated, .pvs-entity');

      for (const exp of expElements) {
        try {
          const titleElement = exp.querySelector('.pvs-entity__path-node, .experience-item__title');
          const companyElement = exp.querySelector('.pvs-entity__path-node + span, .experience-item__company');

          if (titleElement) {
            const expData = {
              position_title: titleElement.textContent.trim(),
              institution_name: companyElement ? companyElement.textContent.trim() : null
            };

            if (expData.position_title && expData.position_title.length > 2) {
              experiences.push(expData);
            }
          }
        } catch (e) {
          console.log(`⚠️ Failed to parse experience:`, e.message);
        }
      }

      console.log(`✅ Extracted ${experiences.length} basic experience entries`);

    } catch (error) {
      console.error('❌ Failed to extract experience:', error);
    }

    return experiences;
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

      // Scroll to education section
      eduSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(1000);

      // Look for "Show all" button
      const expandButtons = [
        'button[aria-label*="Show all"]',
        '.pvs-list__footer-wrapper button',
        '.pvs-list__see-more-button'
      ];

      for (const selector of expandButtons) {
        try {
          const expandButton = eduSection.querySelector(selector);
          if (expandButton && expandButton.offsetParent !== null) {
            console.log(`🎯 Found education expand button: ${selector}`);
            expandButton.click();
            await this.wait(2000);
            break;
          }
        } catch (e) {
          console.log(`⚠️ Failed to expand education with selector ${selector}:`, e.message);
        }
      }

      // Extract basic education info
      const eduElements = eduSection.querySelectorAll('.pvs-list__item--line-separated, .pvs-entity');

      for (const edu of eduElements) {
        try {
          const schoolElement = edu.querySelector('.pvs-entity__path-node, .education-item__school');
          const degreeElement = edu.querySelector('.pvs-entity__path-node + span, .education-item__degree');

          if (schoolElement) {
            const eduData = {
              institution_name: schoolElement.textContent.trim(),
              degree: degreeElement ? degreeElement.textContent.trim() : null
            };

            if (eduData.institution_name && eduData.institution_name.length > 2) {
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
