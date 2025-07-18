/**
 * Ollama LLM Client for Resume Auto-Fill Extension
 * Provides intelligent data extraction and validation using local LLM
 */
export class OllamaClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2:3b';
    this.timeout = config.timeout || 30000; // 30 seconds
  }

  /**
   * Extract LinkedIn profile data using LLM
   */
  async extractLinkedInData(htmlContent, fallbackData = {}) {
    const prompt = `
Extract LinkedIn profile information from the following HTML content.
Return ONLY a valid JSON object with this exact structure:

{
  "personal_info": {
    "full_name": "string",
    "headline": "string", 
    "location": "string",
    "email": "string or null",
    "phone": "string or null",
    "website": "string or null"
  },
  "summary": "string",
  "work_experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "school": "string", 
      "degree": "string",
      "duration": "string"
    }
  ],
  "skills": ["skill1", "skill2"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string"
    }
  ]
}

Rules:
- Extract actual data only, no placeholder text
- If data is not found, use null or empty array
- Deduplicate any repeated content
- Clean up formatting and extra whitespace
- Validate that job titles and company names are realistic
- Ensure skills are actual skills, not section headers

HTML Content:
${htmlContent.substring(0, 8000)}...

${fallbackData && Object.keys(fallbackData).length > 0 ? 
  `\nExisting data to validate/enhance:\n${JSON.stringify(fallbackData, null, 2)}` : ''}
`;

    try {
      const response = await this.callOllama(prompt);
      return this.parseAndValidateResponse(response);
    } catch (error) {
      console.error('❌ LLM extraction failed:', error);
      return fallbackData;
    }
  }

  /**
   * Enhance form filling by matching resume data to form fields
   */
  async enhanceFormFilling(resumeData, formFields) {
    const prompt = `
Given this resume data and form fields, create the best possible mapping.
Return ONLY a valid JSON object mapping form field names to values.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Form Fields Found:
${JSON.stringify(formFields, null, 2)}

Return format:
{
  "field_name_1": "value_from_resume",
  "field_name_2": "value_from_resume"
}

Rules:
- Map resume data to most appropriate form fields
- Use exact values from resume when possible
- For experience, use most recent relevant position
- For skills, choose most relevant ones if field has character limits
- If no good match exists, use null
- Be intelligent about field names (e.g., "fname" = first name)
`;

    try {
      const response = await this.callOllama(prompt);
      return this.parseAndValidateResponse(response);
    } catch (error) {
      console.error('❌ LLM form enhancement failed:', error);
      return {};
    }
  }

  /**
   * Validate and clean extracted data
   */
  async validateData(extractedData) {
    const prompt = `
Validate and clean this extracted profile data. Fix any obvious errors, 
remove duplicates, and ensure data quality.

Data to validate:
${JSON.stringify(extractedData, null, 2)}

Return the cleaned data in the same JSON structure.
Rules:
- Remove duplicate entries
- Validate email formats  
- Ensure realistic job titles and company names
- Clean up extra whitespace and formatting
- Remove any section headers mixed in with data
- Ensure dates are in reasonable formats
`;

    try {
      const response = await this.callOllama(prompt);
      return this.parseAndValidateResponse(response);
    } catch (error) {
      console.error('❌ LLM validation failed:', error);
      return extractedData;
    }
  }

  /**
   * Intelligently fill out job application forms
   */
  async intelligentFormFill(resumeData, jobDescription, formHTML) {
    const prompt = `
You are helping fill out a job application form intelligently.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Job Description:
${jobDescription}

Form HTML (simplified):
${formHTML.substring(0, 4000)}...

Tasks:
1. Identify form fields that need to be filled
2. Match resume data to appropriate fields
3. Tailor responses to the job description when possible
4. Generate intelligent responses for common application questions

Return ONLY a JSON object:
{
  "field_mappings": {
    "field_name": "value_to_fill"
  },
  "generated_responses": {
    "cover_letter": "tailored cover letter text",
    "why_interested": "why interested in this role",
    "strengths": "relevant strengths for this position"
  }
}
`;

    try {
      const response = await this.callOllama(prompt);
      return this.parseAndValidateResponse(response);
    } catch (error) {
      console.error('❌ LLM intelligent form fill failed:', error);
      return { field_mappings: {}, generated_responses: {} };
    }
  }

  /**
   * Call Ollama API
   */
  async callOllama(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for consistent extraction
            top_p: 0.9,
            num_predict: 2048
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('LLM request timed out');
      }
      throw error;
    }
  }

  /**
   * Parse and validate LLM response
   */
  parseAndValidateResponse(response) {
    try {
      // Extract JSON from response (LLM might include extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error);
      console.log('Raw response:', response);
      return {};
    }
  }

  /**
   * Test connection to Ollama
   */
  async testConnection() {
    try {
      const response = await this.callOllama('Test: Return only the word "connected"');
      return response.toLowerCase().includes('connected');
    } catch (error) {
      console.error('❌ Ollama connection test failed:', error);
      return false;
    }
  }
}

/**
 * Simple API for extension content scripts
 */
export class SimpleExtractor {
  constructor() {
    this.ollama = new OllamaClient();
  }

  /**
   * Extract data from any page using minimal scraping + LLM
   */
  async extractFromPage() {
    console.log('🤖 Starting LLM-powered extraction...');

    // Minimal scraping - just get the content
    const content = this.getPageContent();
    
    // Let LLM do the heavy lifting
    const extractedData = await this.ollama.extractLinkedInData(content);
    
    console.log('✅ LLM extraction complete:', extractedData);
    return extractedData;
  }

  /**
   * Get clean page content for LLM processing
   */
  getPageContent() {
    // Get main content area
    const main = document.querySelector('main') || 
                 document.querySelector('#main') ||
                 document.querySelector('.main-content') ||
                 document.body;

    if (!main) return document.body.innerText;

    // Remove unwanted elements
    const unwanted = main.querySelectorAll('script, style, nav, footer, .ads, .sidebar');
    unwanted.forEach(el => el.remove());

    return main.innerText;
  }

  /**
   * Enhanced form filling with LLM assistance
   */
  async fillFormsIntelligently(resumeData) {
    // Find form fields
    const formFields = this.detectFormFields();
    
    // Get job description from page
    const jobDescription = this.extractJobDescription();
    
    // Use LLM to intelligently map data to fields
    const result = await this.ollama.intelligentFormFill(
      resumeData, 
      jobDescription, 
      document.body.innerHTML
    );

    // Fill the fields
    this.applyFieldMappings(result.field_mappings);
    
    return result;
  }

  detectFormFields() {
    const fields = {};
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const name = input.name || input.id || input.placeholder;
      if (name && input.type !== 'hidden') {
        fields[name] = {
          type: input.type || input.tagName.toLowerCase(),
          placeholder: input.placeholder,
          value: input.value
        };
      }
    });
    
    return fields;
  }

  extractJobDescription() {
    const selectors = [
      '.job-description',
      '.job-details',
      '[data-testid*="job"]',
      '.description',
      '.content'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.length > 100) {
        return element.innerText.substring(0, 2000);
      }
    }

    return '';
  }

  applyFieldMappings(mappings) {
    Object.entries(mappings).forEach(([fieldName, value]) => {
      const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
      if (field && value) {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
}