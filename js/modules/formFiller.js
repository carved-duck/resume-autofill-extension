// Form Filler module for Chrome tab communication and form filling
import { isSupportedSite } from './config.js';

export class FormFiller {
  constructor() {
    // Initialize any needed state
  }

  async fillForm(resumeData) {
    if (!resumeData) {
      throw new Error('No resume data found. Please upload a resume first.');
    }

    const currentTab = await this.getCurrentTab();

    if (!isSupportedSite(currentTab.url)) {
      throw new Error('This site is not yet supported for auto-fill');
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'fillForm',
        data: resumeData
      }, (response) => {
        if (!response) {
          reject(new Error('Could not communicate with page. Make sure you\'re on a supported site.'));
          return;
        }

        if (response.success) {
          resolve({
            success: true,
            fieldsCount: response.fieldsCount,
            message: `Successfully filled ${response.fieldsCount} fields!`
          });
        } else {
          reject(new Error(response.error || 'Unknown error'));
        }
      });
    });
  }

  async analyzePageStructure() {
    const currentTab = await this.getCurrentTab();

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'analyzePageStructure'
      }, (response) => {
        if (!response) {
          reject(new Error('Could not analyze page. Make sure content script is loaded.'));
          return;
        }

        if (response.success) {
          resolve({
            analysis: response.analysis,
            insights: response.insights,
            editableButtons: response.editableButtons
          });
        } else {
          reject(new Error(response.error || 'Page analysis failed'));
        }
      });
    });
  }

  async tryClickEditButtons() {
    const currentTab = await this.getCurrentTab();

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'tryClickToReveal'
      }, (response) => {
        if (!response) {
          reject(new Error('Could not communicate with page'));
          return;
        }

        if (response.success) {
          resolve({
            success: true,
            buttonsClicked: response.buttonsClicked,
            fieldsRevealed: response.fieldsRevealed,
            message: `Clicked ${response.buttonsClicked} buttons, ${response.fieldsRevealed} new fields revealed`
          });
        } else {
          reject(new Error(response.error || 'Click operation failed'));
        }
      });
    });
  }

  async getCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs && tabs.length > 0) {
          resolve(tabs[0]);
        } else {
          reject(new Error('No active tab found'));
        }
      });
    });
  }

  async isContentScriptReady() {
    try {
      const currentTab = await this.getCurrentTab();

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(currentTab.id, {
          action: 'ping'
        }, (response) => {
          resolve(!!response);
        });
      });
    } catch (error) {
      return false;
    }
  }
}
