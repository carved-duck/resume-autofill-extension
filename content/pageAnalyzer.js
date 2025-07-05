// Page Analysis Module
// Contains logic for analyzing page structure and monitoring changes

// Prevent multiple loading
if (window.resumeAutoFillPageAnalyzerLoaded) {
  console.log('⚠️ PageAnalyzer module already loaded, skipping...');
} else {
  window.resumeAutoFillPageAnalyzerLoaded = true;

  console.log('🔍 Loading page analyzer...');

  class PageAnalyzer {
    constructor() {
      this.isAnalyzing = false;
      this.observer = null;
    }

    // Simple dynamic analyzer for form detection
    async analyzePageDynamically() {
      if (this.isAnalyzing) return null;

      this.isAnalyzing = true;
      console.log('🔍 Starting dynamic page analysis...');

      try {
        const analysis = {
          forms: this.analyzeForms(),
          fields: this.analyzeFields(),
          buttons: this.analyzeButtons(),
          timestamp: Date.now()
        };

        const recommendations = this.generateRecommendations(analysis);
        console.log('📊 Dynamic analysis complete:', { analysis, recommendations });

        return { analysis, recommendations };
      } catch (error) {
        console.error('❌ Enhanced analysis failed:', error);
        return null;
      } finally {
        this.isAnalyzing = false;
      }
    }

    // Analyze forms on the page
    analyzeForms() {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map((form, index) => ({
        index,
        id: form.id || `form-${index}`,
        action: form.action || 'N/A',
        method: form.method || 'GET',
        fieldCount: form.querySelectorAll('input, textarea, select').length,
        visible: this.isElementVisible(form)
      }));
    }

    // Analyze form fields
    analyzeFields() {
      const fields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, select');
      return Array.from(fields).map((field, index) => ({
        index,
        type: field.type || field.tagName.toLowerCase(),
        name: field.name || '',
        id: field.id || '',
        placeholder: field.placeholder || '',
        visible: this.isElementVisible(field),
        empty: field.value === ''
      }));
    }

    // Analyze buttons that might trigger form submission or navigation
    analyzeButtons() {
      const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]');
      return Array.from(buttons).map((button, index) => {
        const text = button.textContent || button.value || button.getAttribute('aria-label') || '';
        return {
          index,
          text: text.trim(),
          type: button.type || 'button',
          visible: this.isElementVisible(button),
          relevance: this.calculateButtonRelevance(button, text)
        };
      });
    }

    // Calculate button relevance for form submission
    calculateButtonRelevance(element, text) {
      const relevantKeywords = [
        'submit', 'apply', 'send', 'continue', 'next', 'save', 'update',
        '応募', '送信', '保存', '更新', '続行', '次へ', '適用'
      ];

      let score = 0;
      const lowerText = text.toLowerCase();

      for (const keyword of relevantKeywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Button type bonus
      if (element.type === 'submit') score += 15;
      if (element.tagName.toLowerCase() === 'button') score += 5;

      // Class name hints
      const className = element.className || '';
      if (className.includes('submit') || className.includes('primary')) score += 5;

      return score;
    }

    // Generate recommendations based on analysis
    generateRecommendations(analysis) {
      const recommendations = [];

      if (analysis.forms.length === 0) {
        recommendations.push({
          type: 'warning',
          message: 'No forms detected on this page'
        });
      }

      if (analysis.fields.length === 0) {
        recommendations.push({
          type: 'warning',
          message: 'No form fields detected'
        });
      }

      const relevantButtons = analysis.buttons.filter(b => b.relevance > 10);
      if (relevantButtons.length > 0) {
        recommendations.push({
          type: 'info',
          message: `Found ${relevantButtons.length} relevant button(s) for form submission`
        });
      }

      return recommendations;
    }

    // Check if element is visible
    isElementVisible(element) {
      if (!element) return false;

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             rect.width > 0 &&
             rect.height > 0;
    }

    // Start monitoring page changes
    startDynamicMonitoring() {
      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new MutationObserver((mutations) => {
        let significantChange = false;

        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if forms or form fields were added
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) { // Element node
                if (node.tagName === 'FORM' ||
                    node.querySelector && node.querySelector('form, input, textarea')) {
                  significantChange = true;
                  break;
                }
              }
            }
          }
        }

        if (significantChange) {
          console.log('🔄 Significant page change detected, re-analyzing...');
          setTimeout(() => this.analyzePageDynamically(), 1000);
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('👁️ Dynamic monitoring started');
    }

    // Stop monitoring
    stopDynamicMonitoring() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
        console.log('👁️ Dynamic monitoring stopped');
      }
    }
  }

  // Utility functions for page structure analysis
  class PageStructureAnalyzer {
    static async analyzePageStructure() {
      console.log('🔍 Analyzing page structure...');

      try {
        const analysis = {
          url: window.location.href,
          title: document.title,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input').length,
          textareas: document.querySelectorAll('textarea').length,
          selects: document.querySelectorAll('select').length,
          buttons: document.querySelectorAll('button, input[type="submit"]').length,
          timestamp: new Date().toISOString()
        };

        // Look for application-specific indicators
        const bodyText = document.body.textContent.toLowerCase();
        analysis.isJobApplication = bodyText.includes('application') ||
                                    bodyText.includes('apply') ||
                                    bodyText.includes('resume') ||
                                    bodyText.includes('cv') ||
                                    bodyText.includes('応募') ||
                                    bodyText.includes('求人');

        console.log('📊 Page structure analysis:', analysis);
        return analysis;
      } catch (error) {
        console.error('❌ Page structure analysis failed:', error);
        return null;
      }
    }

    // Try clicking intelligent buttons (apply, continue, etc.)
    static async tryClickingIntelligentButtons() {
      console.log('🖱️ Looking for intelligent buttons to click...');

      const buttonSelectors = [
        'button[type="button"]',
        'input[type="button"]',
        '[role="button"]',
        'a[href="#"]',
        '.btn',
        '.button'
      ];

      const relevantKeywords = [
        'apply now', 'apply', 'continue', 'next', 'start application',
        '応募する', '応募', '続行', '次へ', '申請開始'
      ];

      try {
        for (const selector of buttonSelectors) {
          const buttons = document.querySelectorAll(selector);

          for (const [index, button] of buttons.entries()) {
            const text = (button.textContent || button.value || '').toLowerCase().trim();
            const isRelevant = relevantKeywords.some(keyword => text.includes(keyword));

            if (isRelevant && PageAnalyzer.prototype.isElementVisible.call(null, button)) {
              console.log(`🎯 Found relevant button: "${text}" - attempting click...`);

              try {
                button.click();
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for potential page changes
                console.log(`✅ Successfully clicked button: "${text}"`);
                return true;
              } catch (error) {
                console.warn(`⚠️ Error clicking button ${index + 1}:`, error);
              }
            }
          }
        }

        console.log('ℹ️ No relevant buttons found to click');
        return false;
      } catch (error) {
        console.error('❌ Intelligent button interaction failed:', error);
        return false;
      }
    }
  }

  // Initialize page analysis when DOM is ready
  function initializePageAnalysis() {
    // Create global instance
    window.pageAnalyzer = new PageAnalyzer();

    // Set up event listeners for manual triggers
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'analyzePageStructure') {
        PageStructureAnalyzer.analyzePageStructure()
          .then(analysis => {
            console.log('📊 Analysis complete:', analysis);
            sendResponse({ success: true, analysis });
          })
          .catch(error => {
            console.error('❌ Analysis error:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Indicate async response
      }

      if (message.action === 'tryClickingButtons') {
        PageStructureAnalyzer.tryClickingIntelligentButtons()
          .then(clicked => {
            console.log('🖱️ Button interaction complete:', clicked);
            sendResponse({ success: true, clicked });
          })
          .catch(error => {
            console.error('❌ Button interaction error:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Indicate async response
      }

      if (message.action === 'startMonitoring') {
        try {
          window.pageAnalyzer.startDynamicMonitoring();
          sendResponse({ success: true });
        } catch (error) {
          console.error('❌ Monitoring start error:', error);
          sendResponse({ success: false, error: error.message });
        }
      }
    });
  }

  // Export classes to global scope
  window.PageAnalyzer = PageAnalyzer;
  window.PageStructureAnalyzer = PageStructureAnalyzer;

  // Initialize when script loads
  initializePageAnalysis();

  console.log('🔍 Page Analyzer module loaded');
}
