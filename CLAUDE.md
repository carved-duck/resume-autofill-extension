# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Chrome extension that automatically fills job application forms using uploaded resume data. The extension consists of a Python backend server for PDF parsing and a JavaScript frontend with Chrome extension components.

## Development Commands
1. ✅ Fix the first part of the linkedin scraper (finished)
2. ✅ Get to being able to scrape the rest of the linkedin page for information (Part 2 MAJOR PROGRESS)

### LinkedIn Scraper Status - Part 2 COMPLETED ✅
**Single Unified Extractor**: `js/modules/linkedinExtractor.js`
- ✅ **Personal Info**: Name, headline, location, email, website extraction working perfectly
- ✅ **Summary/About**: Successfully extracts full About section content (3200+ chars extracted)
- ✅ **Skills Extraction**: Working! Found 3 skills: "Tesseract OCR", "Tokyo Turntable", "Optical Character Recognition"
- ✅ **Contact Info**: Modal-based email/website extraction working perfectly
- ✅ **Debug System**: Added comprehensive debug functionality via UI button
- ✅ **Experience**: COMPLETED - Fixed all extraction issues with comprehensive improvements
- ✅ **Education**: COMPLETED - Added robust education extraction with multiple fallback strategies

**Major Accomplishments Completed**:
1. ✅ **Fixed Text Deduplication**: Added `deduplicateText()` method to handle LinkedIn's duplicate content issues
2. ✅ **Improved Parsing Logic**: Enhanced job title vs company validation with smarter pattern recognition
3. ✅ **Fixed Metadata Extraction Bug**: MAJOR BUG FIX - `extractCompanyFromMetadata()` now correctly extracts company names from metadata strings like "AEON Corporation · Permanent"
4. ✅ **Code Quality Improvements**: Enhanced error handling, null safety checks, and defensive programming
5. ✅ **Experience Page Navigation**: Added support for redirects to detailed experience pages with automatic navigation back to main profile
6. ✅ **Education Section Extraction**: Completely rebuilt education extraction with:
   - Multiple selector strategies for finding education sections
   - "Show all education" button handling
   - Structured extraction with fallback to text-based parsing
   - Smart validation for school names and degree types
   - Debug functionality for troubleshooting education section issues
7. ✅ **Comprehensive Data Validation**: Added robust validation and quality assurance:
   - `validateAndCleanProfileData()` - Main validation orchestrator
   - `validatePersonalInfo()` - Validates name, email, phone, website, location
   - `validateSummary()` - Cleans and validates summary text with length limits
   - `validateExperiences()` - Ensures title/company validity and data consistency
   - `validateEducations()` - Validates school names, degrees, and date ranges
   - `validateSkills()` - Deduplicates and validates skill entries
   - `validateCertifications()` - Validates certification names and issuers

**Technical Improvements**:
- **Enhanced Error Handling**: Try-catch blocks around all DOM operations
- **Smart Content Detection**: Multiple selector strategies with fallback mechanisms
- **Page Navigation Support**: Handles redirects to detailed pages and navigation back
- **Comprehensive Logging**: Detailed console output for debugging and monitoring
- **Data Quality Assurance**: Multi-layer validation ensures clean, consistent output
- **Deduplication Logic**: Prevents duplicate entries and cleans malformed text

**Final Extraction Capabilities**:
- ✅ Personal info: Complete extraction with validation
- ✅ Summary: Full content extraction with smart cleaning
- ✅ Skills: Robust extraction with deduplication
- ✅ Experience: Complete extraction with metadata parsing and page navigation support
- ✅ Education: Full extraction with structured and text-based fallbacks
- ✅ Certifications: Basic extraction with validation
- ✅ Data Validation: Comprehensive quality assurance for all extracted data

**Part 2 Status: COMPLETED** 🎉
The LinkedIn scraper is now feature-complete with robust extraction capabilities, comprehensive error handling, and data validation. Ready for production use and integration testing.

### Backend Server
```bash
# Start the enhanced backend server (includes PDF parsing and OCR)
python3 enhanced_backend_server.py

# Install Python dependencies
pip install -r enhanced_requirements.txt
```

The backend server runs on `http://localhost:3000` and provides PDF parsing with OCR fallback.

### Chrome Extension Development
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this project folder
4. Extension will appear in Chrome toolbar

### Testing
- No automated test suite is configured
- Manual testing requires loading the extension and testing on supported job sites
- Check browser console for JavaScript errors
- Check backend server logs for PDF parsing issues

## Architecture

### Backend Components
- **enhanced_backend_server.py**: Main Flask server with PDF parsing and OCR
- **backend/enhanced_server.py**: Alternative server implementation
- **backend/modules/resume_parser.py**: Resume parsing utilities

### Frontend Components
- **manifest.json**: Chrome extension configuration (Manifest V3)
- **popup.html/popup.js**: Extension popup interface for file upload and controls
- **background.js**: Service worker for extension background tasks
- **content/**: Content scripts injected into job sites
  - **content_main.js**: Main orchestrator for content script functionality
  - **formFiller.js**: Core form filling logic with site-specific selectors
  - **selectors.js**: Comprehensive field selectors for different job sites
  - **pageAnalyzer.js**: Dynamic page monitoring and form detection
  - **utils.js**: Utility functions for content scripts

### Modular JavaScript Architecture
- **js/modules/**: Reusable ES6 modules
  - **apiClient.js**: Backend API communication
  - **storageManager.js**: Chrome storage management
  - **uiManager.js**: UI state management
  - **formFiller.js**: Form filling coordination
  - **fileHandler.js**: File upload handling
  - **linkedinExtractor.js**: LinkedIn-specific data extraction
  - **config.js**: Configuration constants

### Data Flow
1. User uploads PDF resume via popup
2. Frontend sends PDF to backend server for parsing
3. Backend extracts text using PyPDF2, falls back to OCR if needed
4. Parsed data stored in Chrome storage
5. Content scripts detect form fields on job sites
6. Form filler matches resume data to appropriate fields using selectors
7. Fields are populated automatically

### Supported Job Sites
- LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter
- Workday, Greenhouse, Lever
- Wantedly, Gaijinpot (Japanese job sites)

### Site-Specific Selectors
The extension uses a comprehensive selector system in `content/selectors.js`:
- Generic selectors for common field patterns
- Site-specific selectors for known job sites
- Multi-language support (English and Japanese)
- Fallback mechanisms for dynamic content

### Key Extension Features
- **Dynamic Content Monitoring**: Watches for form changes and new content
- **Smart Field Detection**: Uses multiple selector strategies
- **Multi-language Support**: Handles Japanese and English job sites
- **OCR Fallback**: Processes image-based PDFs when text extraction fails
- **Local Storage**: Resume data stays in browser for privacy

## File Structure Notes
- Content scripts are loaded in order: utils.js, selectors.js, formFiller.js, pageAnalyzer.js, content_main.js
- Popup uses ES6 modules with import/export
- Backend uses Flask with CORS enabled for extension communication
- Icons and web-accessible resources defined in manifest.json

## Development Tips
- Backend server must be running on port 3000 for extension to work
- Check browser console on job sites for content script logs
- Use Chrome DevTools to inspect form fields and selector matching
- Test with various PDF formats to ensure parsing works correctly
- Monitor backend server logs for PDF processing issues
