/**
 * Hybrid Extractor Loader
 * Loads hybrid functionality into existing content script context
 */

export async function loadHybridExtractor() {
  console.log('📦 Loading hybrid functionality...');
  
  try {
    // Check if Ollama is available with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const ollamaTest = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: 'Test',
        stream: false,
        options: { num_predict: 5 }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!ollamaTest.ok) {
      throw new Error('Ollama not available');
    }

    console.log('✅ Ollama available, enabling hybrid mode');

    // Add hybrid enhancement to existing LinkedInExtractor
    if (window.LinkedInExtractor) {
      enhanceLinkedInExtractor();
      return true;
    } else {
      console.warn('⚠️ LinkedInExtractor not found, cannot enhance');
      return false;
    }

  } catch (error) {
    console.warn('⚠️ Hybrid mode unavailable:', error.message);
    return false;
  }
}

function enhanceLinkedInExtractor() {
  const OriginalExtractor = window.LinkedInExtractor;
  
  class EnhancedLinkedInExtractor extends OriginalExtractor {
    constructor() {
      super();
      this.useHybridMode = true;
    }

    async extractProfileData() {
      console.log('🤖 Running enhanced extraction...');
      
      try {
        // Run traditional extraction first
        const traditionalData = await super.extractProfileData();
        console.log('✅ Traditional extraction completed');

        if (!this.useHybridMode) {
          return traditionalData;
        }

        // Enhance with LLM
        const enhancedData = await this.enhanceWithLLM(traditionalData);
        console.log('✅ LLM enhancement completed');
        
        return enhancedData;

      } catch (error) {
        console.error('❌ Enhanced extraction failed:', error);
        // Fallback to traditional
        return await super.extractProfileData();
      }
    }

    async enhanceWithLLM(traditionalData) {
      try {
        const pageContent = this.getPageContent();
        const llmData = await this.callLLM(pageContent);
        
        return this.mergeData(traditionalData, llmData);
      } catch (error) {
        console.warn('⚠️ LLM enhancement failed, using traditional data:', error);
        return traditionalData;
      }
    }

    getPageContent() {
      const main = document.querySelector('main') || document.body;
      const clone = main.cloneNode(true);
      
      // Remove noise
      clone.querySelectorAll('script, style, nav, footer, .ads, button').forEach(el => el.remove());
      
      return clone.innerText.substring(0, 8000); // Limit for LLM
    }

    async callLLM(content) {
      const prompt = `Extract LinkedIn profile data from this content and return ONLY valid JSON:

{
  "personal_info": {
    "full_name": "string",
    "headline": "string",
    "location": "string"
  },
  "summary": "string",
  "work_experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "duration": "string"
    }
  ],
  "skills": ["skill1", "skill2"]
}

Content:
${content}`;

      // Add timeout protection for LLM calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2:3b',
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.1,
              top_p: 0.9,
              num_predict: 1024
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract JSON from response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in LLM response');
        }

        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('LLM request timed out after 30 seconds');
        }
        throw error;
      }
    }

    mergeData(traditional, llm) {
      const merged = { ...traditional };

      // Use LLM data if it's better/more complete
      if (llm.personal_info) {
        Object.keys(llm.personal_info).forEach(key => {
          if (llm.personal_info[key] && 
              (!traditional.personal_info?.[key] || 
               llm.personal_info[key].length > traditional.personal_info[key].length)) {
            merged.personal_info = merged.personal_info || {};
            merged.personal_info[key] = llm.personal_info[key];
            console.log(`🤖 Enhanced ${key} with LLM data`);
          }
        });
      }

      // Use longer summary if available
      if (llm.summary && llm.summary.length > (traditional.summary?.length || 0)) {
        merged.summary = llm.summary;
        console.log('🤖 Enhanced summary with LLM data');
      }

      // Merge experience and education arrays
      if (llm.work_experience?.length > 0) {
        merged.work_experience = [...(traditional.work_experience || []), ...llm.work_experience];
        console.log(`🤖 Added ${llm.work_experience.length} experiences from LLM`);
      }

      if (llm.education?.length > 0) {
        merged.education = [...(traditional.education || []), ...llm.education];
        console.log(`🤖 Added ${llm.education.length} education entries from LLM`);
      }

      // Merge skills
      if (llm.skills?.length > 0) {
        const allSkills = [...(traditional.skills || []), ...llm.skills];
        merged.skills = [...new Set(allSkills)]; // Deduplicate
        console.log(`🤖 Enhanced skills: ${merged.skills.length} total`);
      }

      return merged;
    }

    setHybridMode(enabled) {
      this.useHybridMode = enabled;
      console.log(`🔄 Hybrid mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    async debugCompareExtractions() {
      console.log('🔍 Comparing traditional vs enhanced extraction...');
      
      this.setHybridMode(false);
      const traditionalData = await super.extractProfileData();
      
      this.setHybridMode(true);
      const enhancedData = await this.extractProfileData();
      
      console.log('📊 Extraction Comparison:');
      console.log('Traditional:', traditionalData);
      console.log('Enhanced:', enhancedData);
      
      return { traditional: traditionalData, enhanced: enhancedData };
    }
  }

  // Replace the global constructor
  window.LinkedInExtractor = EnhancedLinkedInExtractor;
  window.HybridLinkedInExtractor = EnhancedLinkedInExtractor;
  
  console.log('✅ LinkedInExtractor enhanced with hybrid capabilities');
}