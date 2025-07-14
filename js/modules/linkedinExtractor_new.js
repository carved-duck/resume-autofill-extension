// Simple LinkedIn Experience Extractor that works with live DOM
export class LinkedInExtractor {
  constructor() {
    this.isLinkedInPage = this.checkIfLinkedInPage();
  }

  checkIfLinkedInPage() {
    return window.location?.hostname?.includes('linkedin.com') || false;
  }

  async extractExperienceBasic() {
    console.log('💼 Extracting experience from live DOM...');
    
    const experiences = [];
    
    try {
      // First, scroll to experience section
      const expSection = document.querySelector('#experience');
      if (expSection) {
        expSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(1000);
      }
      
      // Find all elements that contain job-like content
      const allElements = document.querySelectorAll('*');
      const jobElements = [];
      
      for (const element of allElements) {
        const text = element.textContent?.trim() || '';
        
        // Look for elements that contain job titles and company names
        if (text.length > 50 && text.length < 1000) {
          const hasJobTitle = text.match(/\b(teacher|developer|engineer|manager|analyst|consultant|coordinator|assistant|specialist|director|lead|senior|junior|intern)\b/i);
          const hasCompany = text.match(/\b(corp|corporation|company|inc|ltd|llc|group|studio|agency|technologies|solutions|anchor|aeon|gaba)\b/i);
          const hasDate = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present|current)\b/i);
          
          if ((hasJobTitle || hasCompany) && hasDate) {
            jobElements.push(element);
          }
        }
      }
      
      console.log(`Found ${jobElements.length} potential job elements`);
      
      // Process each job element
      for (let i = 0; i < jobElements.length; i++) {
        const element = jobElements[i];
        const text = element.textContent.trim();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Extract title (first line that looks like a job title)
        let title = '';
        for (const line of lines) {
          if (line.match(/\b(teacher|developer|engineer|manager|analyst|consultant|coordinator|assistant|specialist|director|lead|senior|junior|intern)\b/i)) {
            title = line;
            break;
          }
        }
        
        // Extract company (line with company keywords)
        let company = '';
        for (const line of lines) {
          if (line.match(/\b(corp|corporation|company|inc|ltd|llc|group|studio|agency|technologies|solutions|anchor|aeon|gaba)\b/i)) {
            company = line;
            break;
          }
        }
        
        // Extract date range
        let dateRange = '';
        for (const line of lines) {
          if (line.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present|current)\b/i)) {
            dateRange = line;
            break;
          }
        }
        
        if (title && company) {
          experiences.push({
            title: title,
            company: company,
            date_range: dateRange,
            description: text.length > 200 ? text.substring(0, 200) + '...' : text
          });
          
          console.log(`✅ Added: ${title} at ${company}`);
        }
      }
      
      console.log(`✅ Extracted ${experiences.length} experiences`);
      return experiences;
      
    } catch (error) {
      console.error('❌ Error extracting experience:', error);
      return [];
    }
  }
  
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}