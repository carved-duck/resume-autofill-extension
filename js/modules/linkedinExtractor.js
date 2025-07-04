// LinkedIn Profile Data Extractor
export class LinkedInExtractor {
  constructor() {
    this.isLinkedInPage = this.checkIfLinkedInPage();
  }

  checkIfLinkedInPage() {
    return window.location.hostname.includes('linkedin.com');
  }

  async extractProfileData() {
    if (!this.isLinkedInPage) {
      throw new Error('Not on LinkedIn page');
    }

    console.log('🔍 Extracting LinkedIn profile data...');

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
      // Extract personal information
      await this.extractPersonalInfo(profileData);

      // Extract summary/about section
      await this.extractSummary(profileData);

      // Extract experience
      await this.extractExperience(profileData);

      // Extract education
      await this.extractEducation(profileData);

      // Extract skills
      await this.extractSkills(profileData);

      // Extract projects
      await this.extractProjects(profileData);

      // Extract languages
      await this.extractLanguages(profileData);

      console.log('✅ LinkedIn profile data extracted successfully');
      return profileData;

    } catch (error) {
      console.error('❌ Failed to extract LinkedIn data:', error);
      throw error;
    }
  }

  async extractPersonalInfo(profileData) {
    try {
      // Name
      const nameElement = document.querySelector('h1.text-heading-xlarge, h1.pv-text-details__left-panel h1');
      if (nameElement) {
        const fullName = nameElement.textContent.trim();
        profileData.personal.full_name = fullName;

        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          profileData.personal.first_name = nameParts[0];
          profileData.personal.last_name = nameParts[nameParts.length - 1];
        }
      }

      // Profile headline
      const headlineElement = document.querySelector('.text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium');
      if (headlineElement) {
        profileData.personal.headline = headlineElement.textContent.trim();
      }

      // Location
      const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel .text-body-small');
      if (locationElement) {
        profileData.personal.location = locationElement.textContent.trim();
      }

      // Contact info (if available)
      const contactSection = document.querySelector('#top-card-text-details-contact-info, .pv-contact-info');
      if (contactSection) {
        // Email
        const emailElement = contactSection.querySelector('a[href^="mailto:"]');
        if (emailElement) {
          profileData.personal.email = emailElement.href.replace('mailto:', '');
        }

        // Phone
        const phoneElement = contactSection.querySelector('span[aria-label*="phone"], .ci-phone');
        if (phoneElement) {
          profileData.personal.phone = phoneElement.textContent.trim();
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
      // About section
      const aboutSection = document.querySelector('#about ~ .pv-shared-text-with-see-more, .pv-about-section .pv-about__summary-text');
      if (aboutSection) {
        // Click "see more" if present
        const seeMoreButton = aboutSection.querySelector('button[aria-label*="see more"], .inline-show-more-text__button');
        if (seeMoreButton) {
          seeMoreButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const summaryText = aboutSection.textContent.trim();
        if (summaryText && summaryText.length > 20) {
          profileData.summary = summaryText;
        }
      }

      console.log('✅ Extracted summary from LinkedIn');
    } catch (error) {
      console.warn('⚠️ Failed to extract summary:', error);
    }
  }

  async extractExperience(profileData) {
    try {
      const experienceSection = document.querySelector('#experience ~ .pvs-list, .pv-profile-section.experience-section');
      if (!experienceSection) return;

      const experienceItems = experienceSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

      for (const item of experienceItems) {
        const experience = {};

        // Job title
        const titleElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__summary-info h3');
        if (titleElement) {
          experience.title = titleElement.textContent.trim();
        }

        // Company
        const companyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__secondary-title');
        if (companyElement) {
          experience.company = companyElement.textContent.trim();
        }

        // Duration
        const durationElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__bullet-item-v2');
        if (durationElement) {
          experience.dates = durationElement.textContent.trim();
        }

        // Description
        const descriptionElement = item.querySelector('.pvs-list__outer-container .t-14.t-normal.t-black span[aria-hidden="true"], .pv-entity__extra-details');
        if (descriptionElement) {
          experience.description = descriptionElement.textContent.trim();
        }

        if (experience.title || experience.company) {
          profileData.experience.push(experience);
        }
      }

      console.log(`✅ Extracted ${profileData.experience.length} experience entries from LinkedIn`);
    } catch (error) {
      console.warn('⚠️ Failed to extract experience:', error);
    }
  }

  async extractEducation(profileData) {
    try {
      const educationSection = document.querySelector('#education ~ .pvs-list, .pv-profile-section.education-section');
      if (!educationSection) return;

      const educationItems = educationSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

      for (const item of educationItems) {
        const education = {};

        // School
        const schoolElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__school-name');
        if (schoolElement) {
          education.school = schoolElement.textContent.trim();
        }

        // Degree
        const degreeElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__degree-name');
        if (degreeElement) {
          education.degree = degreeElement.textContent.trim();
        }

        // Year
        const yearElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__dates');
        if (yearElement) {
          const yearText = yearElement.textContent.trim();
          const yearMatch = yearText.match(/\d{4}/);
          if (yearMatch) {
            education.year = yearMatch[0];
          }
        }

        if (education.school || education.degree) {
          profileData.education.push(education);
        }
      }

      console.log(`✅ Extracted ${profileData.education.length} education entries from LinkedIn`);
    } catch (error) {
      console.warn('⚠️ Failed to extract education:', error);
    }
  }

  async extractSkills(profileData) {
    try {
      const skillsSection = document.querySelector('#skills ~ .pvs-list, .pv-profile-section.skills-section');
      if (!skillsSection) return;

      const skillElements = skillsSection.querySelectorAll('.mr1.t-bold span[aria-hidden="true"], .pv-skill-category-entity__name');

      for (const skillElement of skillElements) {
        const skill = skillElement.textContent.trim();
        if (skill && skill.length > 1) {
          profileData.skills.push(skill);
        }
      }

      console.log(`✅ Extracted ${profileData.skills.length} skills from LinkedIn`);
    } catch (error) {
      console.warn('⚠️ Failed to extract skills:', error);
    }
  }

  async extractProjects(profileData) {
    try {
      const projectsSection = document.querySelector('#projects ~ .pvs-list, .pv-profile-section.projects-section');
      if (!projectsSection) return;

      const projectItems = projectsSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

      for (const item of projectItems) {
        const project = {};

        // Project name
        const nameElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__summary-info h3');
        if (nameElement) {
          project.name = nameElement.textContent.trim();
        }

        // Project description
        const descriptionElement = item.querySelector('.t-14.t-normal.t-black span[aria-hidden="true"], .pv-entity__extra-details');
        if (descriptionElement) {
          project.description = descriptionElement.textContent.trim();
        }

        if (project.name) {
          profileData.projects.push(project);
        }
      }

      console.log(`✅ Extracted ${profileData.projects.length} projects from LinkedIn`);
    } catch (error) {
      console.warn('⚠️ Failed to extract projects:', error);
    }
  }

  async extractLanguages(profileData) {
    try {
      const languagesSection = document.querySelector('#languages ~ .pvs-list, .pv-profile-section.languages-section');
      if (!languagesSection) return;

      const languageItems = languagesSection.querySelectorAll('.pvs-list__paged-list-item, .pv-entity__summary-info');

      for (const item of languageItems) {
        const language = {};

        // Language name
        const nameElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__summary-info h3');
        if (nameElement) {
          language.language = nameElement.textContent.trim();
        }

        // Proficiency level
        const proficiencyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__secondary-title');
        if (proficiencyElement) {
          language.proficiency = proficiencyElement.textContent.trim().toLowerCase();
        }

        if (language.language) {
          profileData.languages.push(language);
        }
      }

      console.log(`✅ Extracted ${profileData.languages.length} languages from LinkedIn`);
    } catch (error) {
      console.warn('⚠️ Failed to extract languages:', error);
    }
  }

  // Utility method to scroll and load more content
  async scrollToLoadContent() {
    return new Promise((resolve) => {
      let scrollCount = 0;
      const maxScrolls = 5;

      const scrollInterval = setInterval(() => {
        window.scrollBy(0, 1000);
        scrollCount++;

        if (scrollCount >= maxScrolls) {
          clearInterval(scrollInterval);
          setTimeout(resolve, 1000); // Wait for content to load
        }
      }, 1000);
    });
  }

  // Check if user is on their own profile
  isOwnProfile() {
    const editButton = document.querySelector('[data-control-name="edit_topcard"], .pv-s-profile-actions button');
    return !!editButton;
  }
}
