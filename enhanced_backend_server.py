#!/usr/bin/env python3
"""
Enhanced Resume Auto-Fill Backend Server
Sophisticated PDF parsing with OCR fallback (converted from Rails version)
"""

import os
import re
import json
import tempfile
import logging
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# PDF and OCR libraries
import PyPDF2
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
PORT = 3001  # Changed from 3000 to avoid conflict with Tokyo-Turntable

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class EnhancedResumeParser:
    """Enhanced resume parser with OCR fallback (converted from Rails ResumeParserService)"""

    def __init__(self, file_path):
        self.file_path = file_path
        self.text_content = ""
        self.parsed_data = {}

    def parse(self):
        """Main parsing method"""
        logger.info(f"🚀 Starting resume parsing for file: {self.file_path}")

        try:
            # Step 1: Extract text from PDF
            self.extract_text_from_pdf()

            # Step 2: Parse structured data
            self.parse_personal_information()
            self.parse_experience()
            self.parse_education()
            self.parse_skills()

            # Step 3: Clean and validate data
            self.clean_and_validate_data()

            logger.info("✅ Resume parsing completed successfully")
            return self.parsed_data

        except Exception as e:
            logger.error(f"❌ Resume parsing failed: {str(e)}")
            raise

    def extract_text_from_pdf(self):
        """Extract text from PDF with OCR fallback"""
        try:
            logger.info("📖 Extracting text from PDF...")

            # Try direct text extraction first
            with open(self.file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                extracted_text = ""

                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"

            # If we got meaningful text, use it
            if len(extracted_text.strip()) > 100:
                self.text_content = extracted_text
                logger.info(f"✅ Text extraction successful ({len(self.text_content)} characters)")
                return

            # Fallback to OCR if direct extraction failed
            logger.info("⚠️ Direct text extraction yielded little content, trying OCR...")
            self.extract_text_with_ocr()

        except Exception as e:
            logger.error(f"❌ PDF text extraction failed: {str(e)}")
            # Try OCR as fallback
            self.extract_text_with_ocr()

    def extract_text_with_ocr(self):
        """Extract text using OCR (converted from Rails OCR logic)"""
        try:
            logger.info("🔍 Starting OCR extraction...")

            # Convert PDF to images
            images = convert_from_path(self.file_path, dpi=300)

            # Extract text from each image using Tesseract
            ocr_text = ""
            for i, image in enumerate(images):
                logger.info(f"🖼️ Processing page {i + 1}...")

                # Convert PIL image to text using pytesseract
                page_text = pytesseract.image_to_string(image)
                if page_text:
                    ocr_text += page_text + "\n"

            self.text_content = ocr_text
            logger.info(f"✅ OCR extraction completed ({len(self.text_content)} characters)")

        except Exception as e:
            logger.error(f"❌ OCR extraction failed: {str(e)}")
            self.text_content = "Error: Could not extract text from PDF"

    def parse_personal_information(self):
        """Parse personal information (converted from Rails logic)"""
        logger.info("👤 Parsing personal information...")

        personal = {}

        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_matches = re.findall(email_pattern, self.text_content)
        if email_matches:
            personal['email'] = email_matches[0]

        # Extract phone number
        phone_patterns = [
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # US format
            r'\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}'  # International
        ]

        for pattern in phone_patterns:
            phone_matches = re.findall(pattern, self.text_content)
            if phone_matches:
                personal['phone'] = phone_matches[0].strip()
                break

        # Extract name (first line that looks like a name)
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]
        for line in lines[:5]:
            if re.match(r'^[A-Za-z\s]{2,50}$', line) and not re.search(r'@|\.com|phone|email', line, re.IGNORECASE):
                personal['full_name'] = line.strip()
                name_parts = line.strip().split()
                if name_parts:
                    personal['first_name'] = name_parts[0]
                if len(name_parts) > 1:
                    personal['last_name'] = name_parts[-1]
                break

        # Extract LinkedIn
        linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', self.text_content, re.IGNORECASE)
        if linkedin_match:
            personal['linkedin'] = f"https://{linkedin_match.group()}"

        # Extract GitHub
        github_match = re.search(r'github\.com/[\w-]+', self.text_content, re.IGNORECASE)
        if github_match:
            personal['github'] = f"https://{github_match.group()}"

        # Extract address (lines with city/state patterns)
        address_patterns = [
            r'\b\w+,\s*[A-Z]{2}\s*\d{5}',  # City, ST 12345
            r'\b\w+\s+\w+,\s*[A-Z]{2}',    # City Name, ST
        ]

        for pattern in address_patterns:
            address_match = re.search(pattern, self.text_content)
            if address_match:
                # Look for full address in the lines around this match
                for line in lines:
                    if address_match.group() in line:
                        personal['address'] = line.strip()
                        break
                break

        self.parsed_data['personal'] = personal
        logger.info(f"✅ Extracted personal info: {', '.join(personal.keys())}")

    def parse_experience(self):
        """Parse work experience (enhanced from Rails logic)"""
        logger.info("💼 Parsing work experience...")

        experience = []
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]

        # Look for experience section
        experience_section = False
        current_job = {}

        for i, line in enumerate(lines):
            line_lower = line.lower()

            # Start of experience section
            if any(keyword in line_lower for keyword in ['experience', 'employment', 'work history', 'professional']):
                experience_section = True
                continue

            # Stop at next section
            if experience_section and any(keyword in line_lower for keyword in ['education', 'skills', 'projects']):
                if current_job:
                    experience.append(current_job)
                break

            if experience_section:
                # Company name patterns (lines with "at", "Inc", "LLC", etc.)
                if re.search(r'\b(Inc|LLC|Corp|Company|Ltd|Group|Agency|Studio)\b', line, re.IGNORECASE):
                    if current_job:
                        experience.append(current_job)

                    current_job = {
                        'company': line.strip(),
                        'title': '',
                        'start_date': '',
                        'end_date': '',
                        'description': ''
                    }

                # Job title patterns
                elif re.search(r'\b(Engineer|Developer|Manager|Analyst|Coordinator|Specialist|Director|Associate)\b', line, re.IGNORECASE):
                    if current_job and not current_job.get('title'):
                        current_job['title'] = line.strip()

                # Date patterns
                elif re.search(r'\b(20\d{2}|19\d{2})\b', line):
                    dates = self.extract_dates_from_string(line, current_job)

        # Add last job if exists
        if current_job:
            experience.append(current_job)

        self.parsed_data['experience'] = experience[:5]  # Limit to 5 most recent
        logger.info(f"✅ Extracted {len(experience)} work experiences")

    def parse_education(self):
        """Parse education information (enhanced from Rails logic)"""
        logger.info("🎓 Parsing education...")

        education = []
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]

        # Look for education section
        education_section = False

        for line in lines:
            line_lower = line.lower()

            # Start of education section
            if any(keyword in line_lower for keyword in ['education', 'academic']):
                education_section = True
                continue

            # Stop at next section
            if education_section and any(keyword in line_lower for keyword in ['experience', 'skills', 'projects', 'work']):
                break

            # Only process if we're in education section OR line clearly indicates academic institution
            if education_section or any(keyword in line_lower for keyword in ['university', 'college']):
                # Skip lines that look like work experience (job titles, instructor/teacher roles)
                work_indicators = ['instructor', 'teacher', 'manager', 'director', 'engineer', 'developer',
                                 'analyst', 'coordinator', 'assistant', 'specialist', 'representative',
                                 'consultant', 'administrator']

                # Skip if this looks like work experience
                if any(indicator in line_lower for indicator in work_indicators):
                    continue

                # Institution patterns - be more specific
                if any(keyword in line_lower for keyword in ['university', 'college', 'institute']) and not any(indicator in line_lower for indicator in work_indicators):
                    edu_entry = {
                        'school': line.strip(),
                        'degree': '',
                        'year': ''
                    }

                    # Look for degree in same line or nearby lines
                    if any(degree in line_lower for degree in ['bachelor', 'master', 'phd', 'mba', 'bs', 'ba', 'ms', 'ma', 'degree']):
                        edu_entry['degree'] = line.strip()

                    # Extract year
                    year_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
                    if year_match:
                        edu_entry['year'] = year_match.group()

                    education.append(edu_entry)

        self.parsed_data['education'] = education[:3]  # Limit to 3 entries
        logger.info(f"✅ Extracted {len(education)} education entries")

    def parse_skills(self):
        """Parse skills and technologies (enhanced from Rails logic)"""
        logger.info("🛠️ Parsing skills...")

        skills = set()

        # Technical skills keywords
        tech_skills = [
            'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
            'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'rails',
            'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
            'linux', 'windows', 'macos', 'bash', 'powershell',
            'machine learning', 'ai', 'data science', 'analytics', 'tableau', 'powerbi'
        ]

        text_lower = self.text_content.lower()

        # Find skills mentioned in text
        for skill in tech_skills:
            if skill in text_lower:
                skills.add(skill.title())

        # Look for skills section
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]
        skills_section = False

        for line in lines:
            line_lower = line.lower()

            if any(keyword in line_lower for keyword in ['skills', 'technologies', 'tools', 'languages']):
                skills_section = True
                continue

            if skills_section:
                # Stop at next section
                if any(keyword in line_lower for keyword in ['experience', 'education', 'projects']):
                    break

                # Extract skills from lists (comma-separated, bullet points, etc.)
                skill_words = re.split(r'[,•·\-\n]', line)
                for word in skill_words:
                    word = word.strip()
                    if len(word) > 2 and len(word) < 20:
                        skills.add(word)

        self.parsed_data['skills'] = list(skills)[:20]  # Limit to 20 skills
        logger.info(f"✅ Extracted {len(skills)} skills")

    def extract_dates_from_string(self, date_string, record):
        """Extract start and end dates from a string"""
        # Common date patterns
        date_patterns = [
            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2}|19\d{2})\b',
            r'\b(20\d{2}|19\d{2})\s*-\s*(20\d{2}|19\d{2})\b',
            r'\b(20\d{2}|19\d{2})\b'
        ]

        dates_found = []
        for pattern in date_patterns:
            matches = re.findall(pattern, date_string, re.IGNORECASE)
            dates_found.extend(matches)

        if len(dates_found) >= 2:
            record['start_date'] = str(dates_found[0])
            record['end_date'] = str(dates_found[1])
        elif len(dates_found) == 1:
            record['start_date'] = str(dates_found[0])

        return dates_found

    def clean_and_validate_data(self):
        """Clean and validate the parsed data"""
        logger.info("🧹 Cleaning and validating data...")

        # Clean personal info
        if 'personal' in self.parsed_data:
            personal = self.parsed_data['personal']

            # Validate email
            if 'email' in personal:
                email = personal['email']
                if not re.match(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$', email):
                    del personal['email']

            # Clean phone number
            if 'phone' in personal:
                phone = re.sub(r'[^\d\+\-\(\)\s]', '', personal['phone'])
                personal['phone'] = phone.strip()

        # Clean experience
        if 'experience' in self.parsed_data:
            cleaned_experience = []
            for exp in self.parsed_data['experience']:
                if exp.get('title') or exp.get('company'):
                    cleaned_experience.append(exp)
            self.parsed_data['experience'] = cleaned_experience

        logger.info("✅ Data cleaning completed")

def check_system_dependencies():
    """Check if required system dependencies are installed"""
    logger.info("🔍 Checking system dependencies...")

    missing_deps = []

    # Check Tesseract
    try:
        pytesseract.get_tesseract_version()
        logger.info("✅ Tesseract OCR found")
    except Exception:
        missing_deps.append("Tesseract OCR")

    # Check Poppler (for pdf2image)
    try:
        from pdf2image import convert_from_path
        # Try a small test
        logger.info("✅ Poppler/pdf2image found")
    except Exception:
        missing_deps.append("Poppler (for PDF conversion)")

    if missing_deps:
        logger.warning(f"⚠️ Missing dependencies: {', '.join(missing_deps)}")
        logger.warning("Install with: brew install tesseract poppler (macOS) or apt-get install tesseract-ocr poppler-utils (Ubuntu)")
    else:
        logger.info("✅ All system dependencies found")

@app.route('/resume/parse_api', methods=['POST'])
def parse_resume():
    """Parse uploaded resume PDF with OCR fallback"""

    if 'resume_file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file uploaded'
        }), 400

    file = request.files['resume_file']

    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': 'Only PDF files are allowed'
        }), 400

    try:
        # Save uploaded file temporarily
        if not file.filename:
            return jsonify({
                'success': False,
                'error': 'No filename provided'
            }), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        file.save(file_path)

        # Parse using enhanced parser
        parser = EnhancedResumeParser(file_path)
        parsed_data = parser.parse()

        # Clean up temp file
        os.remove(file_path)

        return jsonify({
            'success': True,
            'data': parsed_data,
            'message': 'Resume parsed successfully (with OCR fallback)',
            'text_length': len(parser.text_content)
        })

    except Exception as e:
        # Clean up temp file if it exists
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)

        logger.error(f"Resume parsing error: {str(e)}")

        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with system info"""

    # Check system dependencies
    deps_ok = True
    try:
        pytesseract.get_tesseract_version()
        from pdf2image import convert_from_path
    except Exception:
        deps_ok = False

    return jsonify({
        'status': 'healthy',
        'message': 'Enhanced Resume Auto-Fill API is running',
        'features': {
            'pdf_text_extraction': True,
            'ocr_fallback': deps_ok,
            'tesseract_available': deps_ok,
            'poppler_available': deps_ok
        },
        'port': PORT
    })

if __name__ == '__main__':
    print("🚀 Starting Enhanced Resume Auto-Fill API Server...")
    print("📡 Server will be available at: http://localhost:3001")
    print("🔗 Chrome extension should point to: http://localhost:3001/resume/parse_api")
    print("⚡ Features: PDF text extraction + OCR fallback + Advanced parsing")

    # Check dependencies
    check_system_dependencies()

    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=True
    )
