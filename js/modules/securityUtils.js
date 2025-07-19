/**
 * Security Utilities for Chrome Extension
 * Provides safe DOM manipulation and input validation
 */

export class SecurityValidator {
  static validateMessage(message) {
    const allowedActions = [
      'fillForm', 
      'extractLinkedIn', 
      'analyzePageStructure', 
      'ping',
      'testHybridExtraction',
      'storageChanged'
    ];
    
    return message && 
           typeof message.action === 'string' && 
           allowedActions.includes(message.action);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>'"&\x00-\x1F\x7F-\x9F]/g, '');
  }

  static validateSender(sender) {
    // Validate that sender is from our extension
    return sender && sender.id === chrome.runtime.id;
  }
}

export class SafeDOM {
  /**
   * Safely set text content without XSS risk
   */
  static setTextContent(element, content) {
    if (!element) return;
    element.textContent = String(content || '');
  }

  /**
   * Safely set HTML content with basic sanitization
   * Note: For production, consider using DOMPurify library
   */
  static setHTMLContent(element, content, allowBasicFormatting = false) {
    if (!element) return;
    
    if (!allowBasicFormatting) {
      element.textContent = String(content || '');
      return;
    }

    // Basic HTML sanitization (for simple formatting)
    const sanitized = String(content || '')
      .replace(/[<>'"&]/g, (char) => {
        const escapeMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[char];
      });
    
    element.innerHTML = sanitized;
  }

  /**
   * Safely create element with text content
   */
  static createElement(tagName, textContent = '', className = '') {
    const element = document.createElement(tagName);
    if (textContent) {
      element.textContent = String(textContent);
    }
    if (className) {
      element.className = String(className);
    }
    return element;
  }

  /**
   * Safely query DOM element with validation
   */
  static querySelector(selector, context = document) {
    try {
      if (typeof selector !== 'string') return null;
      return context.querySelector(selector);
    } catch (error) {
      console.warn('Invalid selector:', selector);
      return null;
    }
  }

  /**
   * Safely query multiple DOM elements
   */
  static querySelectorAll(selector, context = document) {
    try {
      if (typeof selector !== 'string') return [];
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.warn('Invalid selector:', selector);
      return [];
    }
  }
}

export class ErrorBoundary {
  /**
   * Wrap async functions with error handling
   */
  static async wrapAsyncFunction(fn, context = 'unknown') {
    try {
      return await fn();
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      
      // Report to background script for centralized logging
      try {
        chrome.runtime.sendMessage({
          action: 'reportError',
          error: { 
            message: error.message, 
            stack: error.stack, 
            context,
            timestamp: new Date().toISOString()
          }
        });
      } catch (reportError) {
        console.warn('Failed to report error:', reportError);
      }
      
      throw error;
    }
  }

  /**
   * Wrap sync functions with error handling
   */
  static wrapSyncFunction(fn, context = 'unknown', defaultReturn = null) {
    try {
      return fn();
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      return defaultReturn;
    }
  }
}

export class SecureFetch {
  /**
   * Make secure fetch requests with timeouts and validation
   */
  static async request(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
    
    try {
      // Validate URL
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Secure JSON fetch with validation
   */
  static async json(url, options = {}) {
    const response = await this.request(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    // Basic JSON validation
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid JSON response');
    }
    
    return data;
  }
}

export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if request is allowed under rate limit
   */
  isAllowed() {
    const now = Date.now();
    
    // Remove old requests outside window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  /**
   * Get time until next request is allowed
   */
  getRetryAfter() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const retryAfter = (oldestRequest + this.windowMs) - Date.now();
    
    return Math.max(0, retryAfter);
  }
}