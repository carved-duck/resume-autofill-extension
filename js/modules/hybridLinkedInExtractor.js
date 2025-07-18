/**
 * Hybrid LinkedIn Extractor
 * Enhances the existing LinkedIn extractor with LLM capabilities
 * Falls back to traditional scraping when LLM fails
 */

import { LinkedInExtractor } from './linkedinExtractor.js';
import { OllamaClient } from './ollamaClient.js';

export class HybridLinkedInExtractor extends LinkedInExtractor {
  constructor() {
    super();
    this.ollama = new OllamaClient();
    this.useHybridMode = true; // Can be toggled for testing
    this.llmTimeout = 10000; // 10 seconds for LLM calls
  }

  /**
   * Enhanced extraction with LLM validation and fallback
   */
  async extractProfileData() {
    console.log('🚀 Starting hybrid LinkedIn extraction...');

    try {
      // First, try traditional extraction (fast and reliable)
      const traditionalData = await super.extractProfileData();
      console.log('✅ Traditional extraction completed');

      if (!this.useHybridMode) {
        return traditionalData;
      }

      // Enhance with LLM for better data quality
      const enhancedData = await this.enhanceWithLLM(traditionalData);
      
      return enhancedData;

    } catch (error) {
      console.error('❌ Hybrid extraction failed, falling back to traditional:', error);
      return await super.extractProfileData();
    }
  }

  /**
   * Use LLM to enhance and validate extracted data
   */
  async enhanceWithLLM(traditionalData) {
    console.log('🤖 Enhancing data with LLM...');

    try {
      // Get raw page content for LLM
      const pageContent = this.getCleanPageContent();
      
      // Use LLM to validate and enhance the data
      const llmData = await Promise.race([
        this.ollama.extractLinkedInData(pageContent, traditionalData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LLM timeout')), this.llmTimeout)
        )
      ]);

      // Merge traditional and LLM data intelligently
      const mergedData = this.mergeExtractionResults(traditionalData, llmData);
      
      console.log('✅ LLM enhancement completed');
      return mergedData;

    } catch (error) {
      console.warn('⚠️ LLM enhancement failed, using traditional data:', error);
      return traditionalData;
    }
  }

  /**
   * Intelligently merge traditional scraping results with LLM results
   */
  mergeExtractionResults(traditional, llmData) {
    const merged = { ...traditional };

    // Personal info - use LLM for missing fields or validation
    if (llmData.personal_info) {
      merged.personal_info = {
        ...traditional.personal_info,
        ...this.selectBestPersonalInfo(traditional.personal_info, llmData.personal_info)
      };
    }

    // Summary - LLM often does better at extracting full text
    if (llmData.summary && llmData.summary.length > (traditional.summary?.length || 0)) {
      merged.summary = llmData.summary;
      console.log('🤖 Using LLM summary (longer/better)');
    }

    // Work experience - merge and deduplicate
    if (llmData.work_experience?.length > 0) {
      merged.work_experience = this.mergeExperiences(
        traditional.work_experience || [],
        llmData.work_experience
      );
    }

    // Education - merge and deduplicate  
    if (llmData.education?.length > 0) {
      merged.education = this.mergeEducation(
        traditional.education || [],
        llmData.education
      );
    }

    // Skills - LLM often extracts more and cleaner skills
    if (llmData.skills?.length > (traditional.skills?.length || 0)) {
      merged.skills = this.mergeSkills(traditional.skills || [], llmData.skills);
    }

    return merged;
  }

  /**
   * Select best personal info from traditional vs LLM extraction
   */
  selectBestPersonalInfo(traditional, llm) {
    return {
      full_name: this.selectBestField(traditional.full_name, llm.full_name, 'name'),
      headline: this.selectBestField(traditional.headline, llm.headline, 'headline'),
      location: this.selectBestField(traditional.location, llm.location, 'location'),
      email: traditional.email || llm.email || null,
      phone: traditional.phone || llm.phone || null,
      website: traditional.website || llm.website || null
    };
  }

  /**
   * Select the better field value based on quality heuristics
   */
  selectBestField(traditional, llm, fieldType) {
    if (!traditional && !llm) return null;
    if (!traditional) return llm;
    if (!llm) return traditional;

    // Both exist - choose based on quality
    switch (fieldType) {
      case 'name':
        // Prefer longer, more complete names
        return llm.length > traditional.length ? llm : traditional;
      
      case 'headline':
        // Prefer more descriptive headlines
        return llm.length > traditional.length && llm.length < 200 ? llm : traditional;
      
      case 'location':
        // Prefer more specific locations
        if (llm.includes(',') && !traditional.includes(',')) return llm;
        return traditional;
      
      default:
        return traditional; // Default to traditional when unsure
    }
  }

  /**
   * Merge experience arrays, removing duplicates
   */
  mergeExperiences(traditional, llm) {
    const merged = [...traditional];
    
    llm.forEach(llmExp => {
      const isDuplicate = traditional.some(tradExp => 
        this.isSimilarExperience(tradExp, llmExp)
      );
      
      if (!isDuplicate) {
        merged.push(llmExp);
        console.log('🤖 Added LLM experience:', llmExp.title, 'at', llmExp.company);
      }
    });

    return merged;
  }

  /**
   * Check if two experiences are similar (same role/company)
   */
  isSimilarExperience(exp1, exp2) {
    const title1 = exp1.title?.toLowerCase() || '';
    const title2 = exp2.title?.toLowerCase() || '';
    const company1 = exp1.company?.toLowerCase() || '';
    const company2 = exp2.company?.toLowerCase() || '';

    return (title1 === title2 && company1 === company2) ||
           (company1 === company2 && this.calculateSimilarity(title1, title2) > 0.8);
  }

  /**
   * Merge education arrays
   */
  mergeEducation(traditional, llm) {
    const merged = [...traditional];
    
    llm.forEach(llmEdu => {
      const isDuplicate = traditional.some(tradEdu => 
        tradEdu.school?.toLowerCase() === llmEdu.school?.toLowerCase()
      );
      
      if (!isDuplicate) {
        merged.push(llmEdu);
        console.log('🤖 Added LLM education:', llmEdu.school);
      }
    });

    return merged;
  }

  /**
   * Merge and deduplicate skills
   */
  mergeSkills(traditional, llm) {
    const allSkills = [...traditional, ...llm];
    const uniqueSkills = [...new Set(
      allSkills.map(skill => skill.toLowerCase())
    )].map(skill => 
      // Restore original case from first occurrence
      allSkills.find(s => s.toLowerCase() === skill)
    );

    console.log(`🤖 Merged skills: ${traditional.length} + ${llm.length} = ${uniqueSkills.length} unique`);
    return uniqueSkills;
  }

  /**
   * Get clean page content for LLM processing
   */
  getCleanPageContent() {
    // Focus on main content areas
    const mainSelectors = [
      'main',
      '.scaffold-layout__main', 
      '.pv-profile-section',
      '[data-view-name="profile-card"]'
    ];

    let content = '';
    for (const selector of mainSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Remove noise elements
        const clone = element.cloneNode(true);
        clone.querySelectorAll('script, style, .ads, nav, footer, .btn, button').forEach(el => el.remove());
        content += clone.innerText + '\n\n';
      }
    }

    return content || document.body.innerText;
  }

  /**
   * Calculate text similarity (simple approach)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const matches = [...shorter].filter((char, i) => char === longer[i]).length;
    return matches / longer.length;
  }

  /**
   * Toggle between hybrid and traditional mode
   */
  setHybridMode(enabled) {
    this.useHybridMode = enabled;
    console.log(`🔄 Hybrid mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Test LLM connectivity
   */
  async testLLM() {
    try {
      const isConnected = await this.ollama.testConnection();
      console.log(`🤖 LLM status: ${isConnected ? 'Connected ✅' : 'Not available ❌'}`);
      return isConnected;
    } catch (error) {
      console.error('❌ LLM test failed:', error);
      return false;
    }
  }

  /**
   * Debug method to compare extraction results
   */
  async debugCompareExtractions() {
    console.log('🔍 Comparing traditional vs hybrid extraction...');
    
    this.setHybridMode(false);
    const traditionalData = await super.extractProfileData();
    
    this.setHybridMode(true);
    const hybridData = await this.extractProfileData();
    
    console.log('📊 Extraction Comparison:');
    console.log('Traditional:', {
      personal_fields: Object.keys(traditionalData.personal_info || {}).length,
      summary_length: traditionalData.summary?.length || 0,
      experiences: traditionalData.work_experience?.length || 0,
      education: traditionalData.education?.length || 0,
      skills: traditionalData.skills?.length || 0
    });
    
    console.log('Hybrid:', {
      personal_fields: Object.keys(hybridData.personal_info || {}).length,
      summary_length: hybridData.summary?.length || 0,
      experiences: hybridData.work_experience?.length || 0,
      education: hybridData.education?.length || 0,
      skills: hybridData.skills?.length || 0
    });
    
    return { traditional: traditionalData, hybrid: hybridData };
  }
}

// Convenience factory function
export function createHybridExtractor() {
  return new HybridLinkedInExtractor();
}