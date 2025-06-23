// Modular Content Script - Main Entry Point
// Imports site selectors and provides form filling functionality

import { FIELD_SELECTORS, SITE_SPECIFIC_SELECTORS } from './modules/siteSelectors.js';

console.log('🚀 Resume Auto-Fill Extension - Content Script Loaded (Modular Version)');

// Global state
let resumeData = null;

// Main form filling function
function fillFormWithResumeData(data) {
    console.log('📝 Starting form fill with data:', data);
    resumeData = data;

    let fieldsFound = 0;
    const currentSite = window.location.hostname;

    // Get site-specific selectors if available
    const siteSelectors = SITE_SPECIFIC_SELECTORS[currentSite] || {};

    // Fill personal information
    fieldsFound += fillPersonalInfo(data.personal || {}, siteSelectors);

    // Fill work experience
    if (data.experience && data.experience.length > 0) {
        fieldsFound += fillWorkExperience(data.experience[0], siteSelectors);
    }

    // Fill education
    if (data.education && data.education.length > 0) {
        fieldsFound += fillEducation(data.education[0], siteSelectors);
    }

    // Fill cover letter or self-introduction
    fieldsFound += fillTextContent(data, siteSelectors);

    console.log(`✅ Form filling complete! Found and filled ${fieldsFound} fields`);

    // Show success notification
    showNotification(`Auto-filled ${fieldsFound} fields successfully!`, 'success');

    return fieldsFound;
}

function fillPersonalInfo(personal, siteSelectors) {
    let filled = 0;

    // Name fields
    if (personal.full_name) {
        filled += fillField('fullName', personal.full_name, siteSelectors);

        // Also try to fill first/last name if full name exists
        const nameParts = personal.full_name.split(' ');
        if (nameParts.length >= 2) {
            filled += fillField('firstName', nameParts[0], siteSelectors);
            filled += fillField('lastName', nameParts.slice(1).join(' '), siteSelectors);
        }
    }

    // Individual name fields
    if (personal.firstName) {
        filled += fillField('firstName', personal.firstName, siteSelectors);
    }
    if (personal.lastName) {
        filled += fillField('lastName', personal.lastName, siteSelectors);
    }

    // Contact information
    if (personal.email) {
        filled += fillField('email', personal.email, siteSelectors);
    }
    if (personal.phone) {
        filled += fillField('phone', personal.phone, siteSelectors);
    }
    if (personal.address) {
        filled += fillField('address', personal.address, siteSelectors);
    }

    // Japanese-specific fields
    if (personal.full_name) {
        const furigana = generateFurigana(personal.full_name);
        if (furigana) {
            filled += fillField('furiganaFirst', furigana.first, siteSelectors);
            filled += fillField('furiganaLast', furigana.last, siteSelectors);
        }
    }

    return filled;
}

function fillWorkExperience(experience, siteSelectors) {
    let filled = 0;

    if (experience.title) {
        filled += fillField('currentTitle', experience.title, siteSelectors);
    }
    if (experience.company) {
        filled += fillField('currentCompany', experience.company, siteSelectors);
    }

    return filled;
}

function fillEducation(education, siteSelectors) {
    let filled = 0;

    if (education.school) {
        filled += fillField('school', education.school, siteSelectors);
    }
    if (education.degree) {
        filled += fillField('degree', education.degree, siteSelectors);
    }

    return filled;
}

function fillTextContent(data, siteSelectors) {
    let filled = 0;

    // Determine context and fill appropriate content
    const context = detectFormContext();

    if (context === 'profile') {
        // For profile forms, use self-introduction
        const selfIntro = generateSelfIntroduction(data);
        filled += fillField('selfIntroduction', selfIntro, siteSelectors);
    } else {
        // For job applications, use cover letter
        const coverLetter = generateCoverLetter(data);
        filled += fillField('coverLetter', coverLetter, siteSelectors);
    }

    return filled;
}

function fillField(fieldType, value, siteSelectors) {
    if (!value) return 0;

    // Try site-specific selectors first
    let selectors = siteSelectors[fieldType] || [];

    // Fallback to general selectors
    if (selectors.length === 0) {
        selectors = FIELD_SELECTORS[fieldType] || [];
    }

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
            if (element && !element.value && element.offsetParent !== null) {
                try {
                    // Handle different input types
                    if (element.tagName === 'SELECT') {
                        selectOptionByText(element, value);
                    } else if (element.contentEditable === 'true') {
                        element.textContent = value;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    } else {
                        element.value = value;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    console.log(`✅ Filled ${fieldType}: "${value}" using selector: ${selector}`);
                    return 1;
                } catch (error) {
                    console.warn(`⚠️ Error filling field ${fieldType}:`, error);
                }
            }
        }
    }

    return 0;
}

function detectFormContext() {
    // Check URL and page content to determine if this is a profile or application form
    const url = window.location.href.toLowerCase();
    const pageText = document.body.textContent.toLowerCase();

    // Profile indicators
    if (url.includes('profile') || url.includes('account') || url.includes('settings')) {
        return 'profile';
    }

    // Application indicators
    if (url.includes('apply') || url.includes('job') || url.includes('application')) {
        return 'application';
    }

    // Check page content
    if (pageText.includes('about yourself') || pageText.includes('profile') || pageText.includes('自己紹介')) {
        return 'profile';
    }

    return 'application'; // Default to application
}

function generateSelfIntroduction(data) {
    const personal = data.personal || {};
    const experience = data.experience || [];
    const education = data.education || [];

    let intro = '';

    // Professional background
    if (experience.length > 0) {
        const currentJob = experience[0];
        intro += `I am a ${currentJob.title || 'professional'}`;
        if (currentJob.company) {
            intro += ` at ${currentJob.company}`;
        }
        intro += '. ';
    }

    // Education
    if (education.length > 0) {
        const edu = education[0];
        intro += `I graduated from ${edu.school || 'university'}`;
        if (edu.degree) {
            intro += ` with a ${edu.degree}`;
        }
        intro += '. ';
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
        intro += `My technical skills include ${data.skills.slice(0, 5).join(', ')}. `;
    }

    intro += 'I am passionate about contributing to innovative projects and continuous learning.';

    return intro;
}

function generateCoverLetter(data) {
    const personal = data.personal || {};
    const experience = data.experience || [];

    let letter = 'Dear Hiring Manager,\n\n';

    letter += 'I am writing to express my interest in this position. ';

    if (experience.length > 0) {
        const currentJob = experience[0];
        letter += `With my experience as a ${currentJob.title || 'professional'}`;
        if (currentJob.company) {
            letter += ` at ${currentJob.company}`;
        }
        letter += ', I believe I would be a valuable addition to your team.\n\n';
    }

    letter += 'I am eager to bring my skills and enthusiasm to contribute to your organization\'s success. ';
    letter += 'Thank you for considering my application.\n\n';
    letter += 'Best regards,\n';
    letter += personal.full_name || 'Applicant';

    return letter;
}

// Utility functions
function generateFurigana(name) {
    // Simple furigana generation (would need proper implementation)
    if (!name) return null;

    const parts = name.split(' ');
    return {
        first: parts[0] || '',
        last: parts.slice(1).join(' ') || ''
    };
}

function selectOptionByText(selectElement, text) {
    const options = selectElement.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].text.toLowerCase().includes(text.toLowerCase())) {
            selectElement.selectedIndex = i;
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
    }
    return false;
}

function showNotification(message, type = 'info') {
    // Create and show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Message listener for communication with popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Content script received message:', request);

    if (request.action === 'fillForm' && request.resumeData) {
        try {
            const fieldsFound = fillFormWithResumeData(request.resumeData);
            sendResponse({
                success: true,
                fieldsFound: fieldsFound,
                message: `Successfully filled ${fieldsFound} fields`
            });
        } catch (error) {
            console.error('❌ Error filling form:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    } else {
        sendResponse({ success: false, error: 'Invalid request' });
    }

    return true; // Keep message channel open for async response
});

console.log('✅ Resume Auto-Fill Content Script (Modular) - Ready!');
