#!/usr/bin/env node

/**
 * Simple test script to verify Ollama integration works
 * Run with: node test-ollama-integration.js
 */

// Use curl instead of fetch for compatibility
const { execSync } = require('child_process');

function testOllamaConnection() {
  console.log('🤖 Testing Ollama connection...');
  
  try {
    const curlCommand = `curl -s -X POST http://localhost:11434/api/generate -d '{"model": "llama3.2:3b", "prompt": "Test: Return only the word connected", "stream": false}'`;
    const response = execSync(curlCommand, { encoding: 'utf8' });
    const data = JSON.parse(response);
    console.log('✅ Ollama Response:', data.response.trim());
    return true;
  } catch (error) {
    console.error('❌ Ollama test failed:', error.message);
    return false;
  }
}

function testDataExtraction() {
  console.log('🔍 Testing data extraction...');
  
  const sampleLinkedInData = `
    John Smith
    Senior Software Engineer at Google
    San Francisco, CA
    
    About
    Experienced software engineer with 8+ years developing scalable web applications.
    Passionate about React, Node.js, and machine learning.
    
    Experience
    Senior Software Engineer - Google (2020-Present)
    • Led team of 5 engineers building search infrastructure
    • Improved query performance by 40%
    
    Software Engineer - Microsoft (2018-2020)  
    • Developed Azure cloud services
    • Built REST APIs handling 1M+ requests/day
    
    Education
    Master of Science, Computer Science - Stanford University (2016-2018)
    Bachelor of Science, Computer Science - UC Berkeley (2014-2016)
    
    Skills
    JavaScript, Python, React, Node.js, AWS, Docker, Kubernetes
  `;

  const prompt = `
Extract LinkedIn profile information from the following text.
Return ONLY a valid JSON object with this exact structure:

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
  "skills": ["skill1", "skill2"]
}

Text:
${sampleLinkedInData}
`;

  try {
    const jsonPayload = JSON.stringify({
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        num_predict: 1024
      }
    }).replace(/'/g, "'\"'\"'"); // Escape single quotes for shell
    
    const curlCommand = `curl -s -X POST http://localhost:11434/api/generate -d '${jsonPayload}'`;
    const response = execSync(curlCommand, { encoding: 'utf8' });
    const data = JSON.parse(response);
    console.log('🤖 Raw LLM Response:', data.response);
    
    // Try to parse JSON from response
    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const extracted = JSON.parse(jsonMatch[0]);
        console.log('✅ Extracted Data:', JSON.stringify(extracted, null, 2));
        
        // Validate structure
        const hasPersonal = extracted.personal_info && extracted.personal_info.full_name;
        const hasExperience = extracted.work_experience && extracted.work_experience.length > 0;
        const hasEducation = extracted.education && extracted.education.length > 0;
        const hasSkills = extracted.skills && extracted.skills.length > 0;
        
        console.log('📊 Validation Results:');
        console.log(`  Personal Info: ${hasPersonal ? '✅' : '❌'}`);
        console.log(`  Work Experience: ${hasExperience ? '✅' : '❌'} (${extracted.work_experience?.length || 0} entries)`);
        console.log(`  Education: ${hasEducation ? '✅' : '❌'} (${extracted.education?.length || 0} entries)`);
        console.log(`  Skills: ${hasSkills ? '✅' : '❌'} (${extracted.skills?.length || 0} skills)`);
        
        return true;
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError.message);
        return false;
      }
    } else {
      console.error('❌ No JSON found in response');
      return false;
    }
  } catch (error) {
    console.error('❌ Extraction test failed:', error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting Ollama Integration Tests\n');
  
  const connectionTest = testOllamaConnection();
  console.log('');
  
  if (connectionTest) {
    const extractionTest = testDataExtraction();
    console.log('');
    
    if (extractionTest) {
      console.log('🎉 All tests passed! Hybrid approach should work.');
      console.log('💡 Next steps:');
      console.log('  1. Load the Chrome extension');
      console.log('  2. Go to a LinkedIn profile page'); 
      console.log('  3. Toggle hybrid mode in the popup');
      console.log('  4. Test extraction');
    } else {
      console.log('⚠️ Extraction test failed. LLM might need fine-tuning.');
    }
  } else {
    console.log('❌ Connection test failed. Make sure Ollama is running:');
    console.log('  ollama serve');
  }
}

main();