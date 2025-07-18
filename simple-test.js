const { execSync } = require('child_process');
const fs = require('fs');

console.log('🤖 Testing Ollama connection...');

try {
  // Simple connection test
  const response = execSync('curl -s -X POST http://localhost:11434/api/generate -d \'{"model": "llama3.2:3b", "prompt": "Say: connected", "stream": false}\'', { encoding: 'utf8' });
  const data = JSON.parse(response);
  console.log('✅ Ollama Response:', data.response.trim());
  
  // Test data extraction with temp file
  const prompt = `Extract name and job from: "John Smith, Senior Software Engineer at Google, San Francisco"

Return ONLY valid JSON:
{
  "name": "extracted name",
  "job": "extracted job title",
  "company": "extracted company"
}`;

  // Write to temp file to avoid shell escaping issues
  const tempFile = '/tmp/ollama_test.json';
  fs.writeFileSync(tempFile, JSON.stringify({
    model: 'llama3.2:3b',
    prompt: prompt,
    stream: false,
    options: { temperature: 0.1, num_predict: 256 }
  }));

  const extractResponse = execSync(`curl -s -X POST http://localhost:11434/api/generate -d @${tempFile}`, { encoding: 'utf8' });
  const extractData = JSON.parse(extractResponse);
  
  console.log('🔍 Extraction Response:', extractData.response);
  
  // Try to parse JSON
  const jsonMatch = extractData.response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = JSON.parse(jsonMatch[0]);
    console.log('✅ Parsed Data:', extracted);
    console.log('🎉 LLM extraction working! Hybrid approach is viable.');
  } else {
    console.log('⚠️ No JSON found in response');
  }
  
  // Cleanup
  fs.unlinkSync(tempFile);
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.log('Make sure Ollama is running: ollama serve');
}