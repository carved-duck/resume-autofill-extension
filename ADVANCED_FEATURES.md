# 🚀 Resume Auto-Fill System

A complete solution for automatically filling job application forms using your resume data. Built with Rails backend + Chrome extension frontend.

## ✨ What This Does

- **📄 PDF Resume Parsing**: Upload your resume PDF and extract structured data
- **🤖 Smart OCR**: Handles both text-based and image-based PDFs
- **🔗 Chrome Extension**: Auto-fills job applications on LinkedIn, Indeed, Glassdoor, etc.
- **🎯 Form Field Detection**: Intelligently finds and fills form fields
- **💾 Data Storage**: Stores your parsed resume data locally for reuse

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PDF Resume    │───▶│  Rails Backend  │───▶│ Chrome Extension│
│                 │    │                 │    │                 │
│ • Text-based    │    │ • PDF parsing   │    │ • Form filling  │
│ • Image-based   │    │ • OCR services  │    │ • Site detection│
│ • Multi-page    │    │ • Data extract  │    │ • User interface│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Backend Setup (Rails)

```bash
# Your Rails app is already configured!
# Just start the server
rails server

# Test the resume parser
curl -X POST http://localhost:3000/resume/parse_api \
  -F "resume_file=@your_resume.pdf"
```

### 2. Test the Web Interface

Visit: `http://localhost:3000/resume`

1. Upload your resume PDF
2. View the extracted data
3. Copy the JSON for development

### 3. Chrome Extension Setup

1. **Copy the extension files**:
   ```bash
   cp -r chrome_extension_example /path/to/your/extension
   ```

2. **Load in Chrome**:
   - Open Chrome → Extensions → Developer mode
   - Click "Load unpacked"
   - Select the `chrome_extension_example` folder

3. **Update API URL**:
   - Edit `popup.js` line 15
   - Change `http://localhost:3000` to your deployed URL

## 📋 Features

### PDF Parsing Capabilities

- ✅ **Text-based PDFs** (direct text extraction)
- ✅ **Image-based PDFs** (OCR conversion)
- ✅ **Multi-page documents**
- ✅ **Mixed content** (text + images)

### Data Extraction

- 👤 **Personal Info**: Name, email, phone, address, LinkedIn, GitHub
- 🎓 **Education**: Degrees, institutions, graduation years
- 💼 **Work Experience**: Job titles, companies, dates, descriptions
- 🛠️ **Skills**: Technical skills and competencies
- 📜 **Certifications**: Professional certifications and licenses

### Supported Job Sites

- 🔗 **LinkedIn** (job applications)
- 📋 **Indeed** (application forms)
- 🏢 **Glassdoor** (company applications)
- 👔 **Monster** (job postings)
- ⚡ **ZipRecruiter** (quick apply)
- 🌐 **Generic forms** (most job sites)

## 🎯 How It Works

### 1. Resume Upload & Parsing

```ruby
# Backend service extracts structured data
resume_data = ResumeParserService.parse_resume_from_pdf(pdf_path)

# Returns structured JSON:
{
  personal_info: {
    full_name: "John Doe",
    email: "john@example.com",
    phone: "(555) 123-4567"
  },
  education: [...],
  work_experience: [...],
  skills: [...],
  certifications: [...]
}
```

### 2. Chrome Extension Storage

```javascript
// Stores parsed data locally
chrome.storage.local.set({ resumeData: parsed_data });

// Retrieves for form filling
chrome.storage.local.get(['resumeData'], callback);
```

### 3. Intelligent Form Filling

```javascript
// Detects form fields using multiple strategies
const selectors = [
  'input[name*="firstName"]',
  'input[id*="first-name"]',
  'input[placeholder*="First name"]'
];

// Fills fields and triggers events
element.value = data.personal.first_name;
element.dispatchEvent(new Event('input', { bubbles: true }));
```

## 🔧 API Endpoints

### Parse Resume

```bash
POST /resume/parse_api
Content-Type: multipart/form-data

# Body
resume_file: [PDF file]

# Response
{
  "success": true,
  "data": {
    "personal": { ... },
    "education": [ ... ],
    "experience": [ ... ],
    "skills": [ ... ]
  }
}
```

### Web Interface

```bash
GET  /resume          # Upload form
POST /resume/parse    # Parse and display results
```

## 🎨 Extension Usage

1. **Upload Resume**: Click extension icon → Upload PDF
2. **Parse Data**: Extension sends to Rails API → Gets structured data
3. **Auto-Fill**: Visit job site → Click "Auto-Fill Current Page"
4. **Customize**: Edit data in Chrome storage if needed

## 🔍 Technical Details

### OCR Engine Fallback

```ruby
# Smart fallback strategy
1. Try EasyOCR (best for mixed language)
2. Fallback to Tesseract (faster for English)
3. Fallback to PaddleOCR (alternative engine)
```

### Form Field Detection

```javascript
// Multi-strategy field detection
1. Site-specific selectors (LinkedIn, Indeed, etc.)
2. Common naming conventions (firstName, lastName)
3. Placeholder text matching
4. ID and class name patterns
```

### Data Processing Pipeline

```
PDF → Direct Text Extraction → Parse Structure
 ↓
PDF → Image Conversion → OCR → Parse Structure
 ↓
Structured Data → Chrome Storage → Form Filling
```

## 🛠️ Development

### Adding New Job Sites

1. **Add site-specific selectors**:
   ```javascript
   SITE_SPECIFIC_SELECTORS['newsite.com'] = {
     firstName: ['input[name="fname"]'],
     email: ['input[id="email-field"]']
   };
   ```

2. **Update manifest permissions**:
   ```json
   "host_permissions": [
     "https://*.newsite.com/*"
   ]
   ```

### Improving Parser Accuracy

1. **Add more regex patterns** in `ResumeParserService`
2. **Enhance section detection** keywords
3. **Improve OCR preprocessing** (image quality, DPI)

### Customizing Data Format

```ruby
# Modify format_for_autofill in ResumeController
def format_for_autofill(resume_data)
  {
    # Add new fields here
    custom_field: extract_custom_data(resume_data)
  }
end
```

## 🐛 Troubleshooting

### Common Issues

1. **"No fields found"**
   - Check if site is supported
   - Verify form field selectors
   - Check Chrome developer console

2. **"Parse failed"**
   - Ensure PDF is not password protected
   - Check if OCR services are available
   - Try different PDF format

3. **"Server error"**
   - Confirm Rails server is running
   - Check CORS settings for API calls
   - Verify file upload limits

### Debug Mode

```javascript
// Enable debug logging in extension
console.log('Form filling debug:', data);

// Check parsed data
chrome.storage.local.get(['resumeData'], console.log);
```

## 🚀 Deployment

### Rails Backend

```bash
# Deploy to Heroku, Railway, etc.
git push heroku main

# Update extension API URL
const API_BASE_URL = 'https://yourapp.herokuapp.com';
```

### Chrome Extension

```bash
# Package for Chrome Web Store
zip -r resume-autofill-extension.zip chrome_extension_example/

# Upload to Chrome Web Store Developer Dashboard
```

## 📈 Future Enhancements

- 🎯 **AI-powered cover letter generation**
- 🔍 **Job matching based on skills**
- 📊 **Application tracking dashboard**
- 🔄 **Real-time form field learning**
- 🌍 **Multi-language support**
- 📱 **Mobile app integration**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ready to revolutionize your job application process!** 🎉

Start by testing the web interface at `http://localhost:3000/resume`, then install the Chrome extension for the full auto-fill experience.
