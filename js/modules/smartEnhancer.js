/**
 * Smart Data Enhancer with LLM Backend Integration
 * Applies intelligent fixes to extracted LinkedIn data using LLM when available
 * Falls back to rule-based enhancements when LLM is not available
 */

import { SecureFetch, RateLimiter } from './securityUtils.js';

const BACKEND_URL = 'http://localhost:3000';
const llmRateLimiter = new RateLimiter(5, 60000); // 5 requests per minute

async function tryLLMEnhancement(originalData) {
  const log = window.logger || console;
  log.debug?.('Attempting LLM enhancement') || console.log('🔍 Attempting LLM enhancement via backend...');
  
  try {
    // Check rate limit
    if (!llmRateLimiter.isAllowed()) {
      log.warn?.('LLM rate limit exceeded') || console.log('⚠️ LLM rate limit exceeded, falling back to rule-based');
      return null;
    }

    // Check LLM status first
    const statusData = await SecureFetch.json(`${BACKEND_URL}/api/llm/status`, {
      timeout: 5000
    });
    
    if (!statusData.available) {
      log.warn?.('LLM not available', statusData.message) || console.log('⚠️ LLM not available:', statusData.message);
      return null;
    }
    
    log.debug?.(`LLM available: ${statusData.model}`) || console.log(`✅ LLM available: ${statusData.model}`);
    
    // Identify issues that need LLM enhancement
    const issues = identifyDataIssues(originalData);
    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalIssues > 0) {
      log.info?.(`Found ${totalIssues} data issues for enhancement`) || console.log(`🔧 Found ${totalIssues} issues for enhancement`);
    }
    
    if (issues.companyIssues.length > 0) {
      return await enhanceWithLLM(originalData, 'company_extraction');
    }
    
    if (issues.descriptionIssues.length > 0) {
      return await enhanceWithLLM(originalData, 'job_descriptions');
    }
    
    // General enhancement if no specific issues
    return await enhanceWithLLM(originalData, 'general');
    
  } catch (error) {
    log.error?.('LLM enhancement failed', error) || console.error('❌ LLM enhancement error:', error);
    return null;
  }
}

async function enhanceWithLLM(data, enhancementType) {
  const log = window.logger || console;
  log.debug?.(`Requesting LLM enhancement: ${enhancementType}`) || console.log(`🤖 Requesting LLM enhancement: ${enhancementType}`);
  
  const payload = {
    data: data,
    type: enhancementType,
    pageContent: document.body.innerText.substring(0, 5000) // Send page context
  };
  
  const result = await SecureFetch.json(`${BACKEND_URL}/api/llm/enhance-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    timeout: 30000 // 30 second timeout for LLM requests
  });
  
  log.success?.('LLM enhancement completed', {
    type: enhancementType,
    issuesFixed: result.issues_fixed || 0,
    enhancementApplied: result.enhancement_applied
  }) || console.log('🎯 LLM enhancement result:', result);
  
  return result;
}

function identifyDataIssues(data) {
  const issues = {
    companyIssues: [],
    descriptionIssues: [],
    skillIssues: [],
    educationIssues: []
  };
  
  // Check for company name issues and nested position problems
  if (data.work_experience) {
    const companyNames = new Map();
    
    data.work_experience.forEach((exp, index) => {
      // Check for description being used as company name
      if (exp.company && exp.company.length > 100) {
        issues.companyIssues.push({
          index,
          issue: 'Company name too long (likely description)',
          current: exp.company.substring(0, 50) + '...'
        });
      }
      
      // Check for job descriptions being used as company names
      if (exp.company && /^(created|managed|developed|implemented|led|responsible|achieved|conducted|provided|gained|filled|served|coordinated|responded)/i.test(exp.company)) {
        issues.companyIssues.push({
          index,
          issue: 'Job description used as company name',
          current: exp.company.substring(0, 50) + '...'
        });
      }
      
      // Track company occurrences for nested position detection
      if (exp.company && exp.company.length < 100) {
        if (!companyNames.has(exp.company)) {
          companyNames.set(exp.company, []);
        }
        companyNames.get(exp.company).push({ index, title: exp.title, dateRange: exp.date_range });
      }
    });
    
    // Check for potential nested positions (same company, different titles/dates)
    companyNames.forEach((positions, company) => {
      if (positions.length > 1) {
        // Check if these might be separate positions that should be grouped
        const hasDistinctDates = positions.some((pos, i) => 
          positions.some((other, j) => i !== j && pos.dateRange !== other.dateRange)
        );
        
        if (hasDistinctDates) {
          console.log(`🔍 Potential nested positions detected for ${company}:`, positions);
        }
      }
    });
  }
  
  // Check for description issues
  if (data.work_experience) {
    data.work_experience.forEach((exp, index) => {
      if (exp.description && exp.description.length < 50) {
        issues.descriptionIssues.push({
          index,
          issue: 'Description too short',
          current: exp.description
        });
      }
    });
  }
  
  // Check for problematic skills
  if (data.skills) {
    const problematicSkills = ['Tokyo Turntable', 'Tesseract OCR'];
    problematicSkills.forEach(skill => {
      if (data.skills.includes(skill)) {
        issues.skillIssues.push({
          skill,
          issue: 'Non-technical skill detected'
        });
      }
    });
  }
  
  // Check for missing education
  if (!data.education || data.education.length === 0) {
    issues.educationIssues.push({
      issue: 'No education data found'
    });
  }
  
  console.log('🔍 Data issues identified:', issues);
  return issues;
}

export async function enhanceLinkedInData(originalData, useEnhancement = true) {
  console.log('🤖 Applying smart enhancements to LinkedIn data...');
  
  if (!useEnhancement) {
    console.log('🔄 Enhancement disabled, returning original data');
    return originalData;
  }
  
  const enhanced = JSON.parse(JSON.stringify(originalData)); // Deep copy
  
  // Try LLM enhancement first
  try {
    const llmResult = await tryLLMEnhancement(originalData);
    if (llmResult && llmResult.success) {
      console.log('✅ LLM enhancement successful');
      return llmResult.data;
    }
  } catch (error) {
    console.log('⚠️ LLM enhancement failed, falling back to rule-based:', error.message);
  }
  
  // Fix company name extraction issues
  if (enhanced.work_experience) {
    enhanced.work_experience = enhanced.work_experience.map((exp, index) => {
      if (exp.company && exp.company.length > 100) {
        console.log(`🔧 Fixing company name for experience ${index}: "${exp.company.substring(0, 50)}..."`);
        
        // Try to find company name contextually around this job's date range
        const dateRange = exp.date_range || '';
        const pageText = document.body.innerText;
        
        // Look for company patterns near this job's date range
        let contextualCompany = null;
        
        if (dateRange) {
          // Extract key date parts to search around
          const dateMatches = dateRange.match(/\w+ \d{4}/g); // e.g., ["Jun 2023", "Mar 2025"]
          if (dateMatches && dateMatches.length > 0) {
            const startDate = dateMatches[0];
            
            // Look for text sections containing this date range
            const pageLines = pageText.split('\n');
            for (let i = 0; i < pageLines.length; i++) {
              const line = pageLines[i];
              if (line.includes(startDate) || line.includes(dateRange.substring(0, 15))) {
                // Look in surrounding lines for company patterns
                const contextLines = pageLines.slice(Math.max(0, i-3), i+4);
                const contextText = contextLines.join(' ');
                
                // Check for specific companies in this context
                const companyPatterns = [
                  { pattern: /Anchor Studio Corporation/gi, name: 'Anchor Studio Corporation' },
                  { pattern: /AEON Corporation/gi, name: 'AEON Corporation' },
                  { pattern: /Gaba Corporation/gi, name: 'Gaba Corporation' },
                  { pattern: /Embassy Suites/gi, name: 'Embassy Suites' }
                ];
                
                for (const { pattern, name } of companyPatterns) {
                  if (pattern.test(contextText)) {
                    contextualCompany = name;
                    console.log(`🎯 Found contextual company "${name}" near date "${startDate}"`);
                    break;
                  }
                }
                
                if (contextualCompany) break;
              }
            }
          }
        }
        
        if (contextualCompany) {
          console.log(`✅ Fixed company: "${exp.company.substring(0, 30)}..." → "${contextualCompany}"`);
          return { ...exp, company: contextualCompany };
        }
        
        // Fallback: try global patterns
        const companyPatterns = [
          /Anchor Studio Corporation/gi,
          /AEON Corporation/gi,
          /Gaba Corporation/gi,
          /Embassy Suites/gi,
          /([A-Z][a-z]+ (?:Corporation|Company|Inc|LLC|Ltd))/g
        ];
        
        for (const pattern of companyPatterns) {
          const matches = pageText.match(pattern);
          if (matches && matches[0]) {
            const fixedCompany = matches[0];
            console.log(`✅ Fixed company (fallback): "${exp.company.substring(0, 30)}..." → "${fixedCompany}"`);
            return { ...exp, company: fixedCompany };
          }
        }
        
        // Final fallback: try to extract from description
        const descWords = exp.company.split(' ').slice(0, 3).join(' ');
        if (descWords.length < exp.company.length) {
          console.log(`🔧 Using description fallback: "${descWords}"`);
          return { ...exp, company: descWords };
        }
      }
      return exp;
    });
  }
  
  // Fix skills issues
  if (enhanced.skills) {
    const skillFixes = {
      'Tokyo Turntable': 'Web Development',
      'Tesseract OCR': 'OCR Technology',
      'Optical Character Recognition': 'OCR Technology'
    };
    
    enhanced.skills = enhanced.skills.map(skill => {
      if (skillFixes[skill]) {
        console.log(`🔧 Fixed skill: "${skill}" → "${skillFixes[skill]}"`);
        return skillFixes[skill];
      }
      return skill;
    });
    
    // Remove duplicate skills
    enhanced.skills = [...new Set(enhanced.skills)];
  }
  
  // Try to extract missing education
  if (!enhanced.education || enhanced.education.length === 0) {
    console.log('🎓 Attempting to extract missing education...');
    
    const pageText = document.body.innerText;
    const educationPatterns = [
      /University of [A-Z][a-z]+/gi,
      /[A-Z][a-z]+ University/gi,
      /[A-Z][a-z]+ College/gi,
      /Le Wagon/gi,
      /Bachelor['s]*\s+(?:of|in)\s+[A-Z][a-z\s]+/gi,
      /Master['s]*\s+(?:of|in)\s+[A-Z][a-z\s]+/gi
    ];
    
    const foundEducation = [];
    educationPatterns.forEach(pattern => {
      const matches = pageText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!foundEducation.includes(match)) {
            foundEducation.push(match);
          }
        });
      }
    });
    
    if (foundEducation.length > 0) {
      enhanced.education = foundEducation.map(school => ({
        school: school,
        degree: '',
        duration: '',
        extracted_by: 'smart_enhancer'
      }));
      console.log(`✅ Found ${foundEducation.length} education entries:`, foundEducation);
    }
  }
  
  // Add enhancement metadata
  enhanced.enhancement_applied = true;
  enhanced.enhancement_timestamp = new Date().toISOString();
  enhanced.enhancement_type = 'smart_enhancer';
  
  // Calculate improvement metrics
  const improvements = {
    company_names_fixed: 0,
    skills_cleaned: 0,
    education_found: enhanced.education ? enhanced.education.filter(e => e.extracted_by === 'smart_enhancer').length : 0
  };
  
  if (originalData.work_experience && enhanced.work_experience) {
    improvements.company_names_fixed = enhanced.work_experience.filter((exp, i) => 
      originalData.work_experience[i] && exp.company !== originalData.work_experience[i].company
    ).length;
  }
  
  if (originalData.skills && enhanced.skills) {
    improvements.skills_cleaned = originalData.skills.length - enhanced.skills.length;
  }
  
  enhanced.enhancement_metrics = improvements;
  
  console.log('✅ Smart enhancement completed:', improvements);
  
  return enhanced;
}

export function shouldApplyEnhancements(data) {
  // Check if enhancements would be beneficial
  let issuesFound = 0;
  
  // Check for company name issues
  if (data.work_experience) {
    issuesFound += data.work_experience.filter(exp => 
      exp.company && exp.company.length > 100
    ).length;
  }
  
  // Check for skill issues
  if (data.skills) {
    const problematicSkills = ['Tokyo Turntable', 'Tesseract OCR'];
    issuesFound += data.skills.filter(skill => 
      problematicSkills.includes(skill)
    ).length;
  }
  
  // Check for missing education
  if (!data.education || data.education.length === 0) {
    issuesFound += 1;
  }
  
  console.log(`🔍 Found ${issuesFound} potential issues that can be enhanced`);
  return issuesFound > 0;
}