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
PORT = 3000  # Consolidated port for Chrome extension compatibility

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

    logger.info("🔍 [API] Received resume upload request")
    logger.info(f"🔍 [API] Request files: {list(request.files.keys())}")

    if 'resume_file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file uploaded'
        }), 400

    file = request.files['resume_file']
    logger.info(f"🔍 [API] File received: {file.filename}")

    if file.filename == '':
        logger.error("❌ [API] Empty filename")
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400

    if not allowed_file(file.filename):
        logger.error(f"❌ [API] Invalid file type: {file.filename}")
        return jsonify({
            'success': False,
            'error': 'Only PDF files are allowed'
        }), 400

    try:
        logger.info("🔍 [API] Starting PDF processing...")

        # Save uploaded file temporarily
        if not file.filename:
            return jsonify({
                'success': False,
                'error': 'No filename provided'
            }), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        logger.info(f"🔍 [API] Saving file to: {file_path}")

        file.save(file_path)
        logger.info("✅ [API] File saved successfully")

        # Check file size
        file_size = os.path.getsize(file_path)
        logger.info(f"🔍 [API] Saved file size: {file_size} bytes")

        # Parse using enhanced parser
        logger.info("🔍 [API] Starting enhanced parsing...")
        parser = EnhancedResumeParser(file_path)
        parsed_data = parser.parse()

        # Log parsing results
        logger.info("✅ [API] Parsing successful")
        logger.info(f"🔍 [API] Parsed data keys: {list(parsed_data.keys())}")
        for key, value in parsed_data.items():
            if isinstance(value, list):
                logger.info(f"🔍 [API] {key}: {len(value)} items")
            elif isinstance(value, dict):
                logger.info(f"🔍 [API] {key}: {value}")

        # Clean up temp file
        os.remove(file_path)
        logger.info("✅ [API] Temporary file cleaned up")

        logger.info("✅ [API] Processing completed successfully")
        return jsonify({
            'success': True,
            'data': parsed_data,
            'message': 'Resume parsed successfully (with OCR fallback)',
            'text_length': len(parser.text_content)
        })

    except Exception as e:
        logger.error(f"❌ [API] Exception occurred: {str(e)}")
        logger.error(f"❌ [API] Exception type: {type(e).__name__}")

        # Clean up temp file if it exists
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info("✅ [API] Cleaned up temp file after error")
            except Exception as cleanup_error:
                logger.warning(f"⚠️ [API] Failed to cleanup temp file: {cleanup_error}")

        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/linkedin/parse_api', methods=['POST'])
def parse_linkedin_profile():
    """Parse LinkedIn profile text using text-based parser"""

    logger.info("🔍 [API] Received LinkedIn profile parsing request")

    if not request.is_json:
        return jsonify({
            'success': False,
            'error': 'Content-Type must be application/json'
        }), 400

    data = request.get_json()
    profile_text = data.get('profile_text', '')

    if not profile_text:
        return jsonify({
            'success': False,
            'error': 'No profile text provided'
        }), 400

    try:
        logger.info("🔍 [API] Starting LinkedIn profile parsing...")
        logger.info(f"🔍 [API] Profile text length: {len(profile_text)} characters")
        logger.info(f"🔍 [API] First 200 chars: {profile_text[:200]}")

        # Parse the LinkedIn profile text directly
        parsed_data = parse_linkedin_text(profile_text)

        # Log parsing results
        logger.info("✅ [API] LinkedIn parsing successful")
        logger.info(f"🔍 [API] Parsed data keys: {list(parsed_data.keys())}")
        for key, value in parsed_data.items():
            if isinstance(value, list):
                logger.info(f"🔍 [API] {key}: {len(value)} items")
            elif isinstance(value, dict):
                logger.info(f"🔍 [API] {key}: {value}")

        return jsonify({
            'success': True,
            'data': parsed_data,
            'message': 'LinkedIn profile parsed successfully',
            'text_length': len(profile_text)
        })

    except Exception as e:
        logger.error(f"❌ [API] LinkedIn parsing failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

def parse_linkedin_text(text):
    """Parse LinkedIn profile text and extract structured data"""

    parsed_data = {
        'personal': {},
        'experience': [],
        'education': [],
        'skills': []
    }

    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # Extract personal information
    for i, line in enumerate(lines):
        # Skip section headers
        if line.upper() in ['PERSONAL INFORMATION', 'EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS', 'CERTIFICATIONS', 'LANGUAGES', 'SUMMARY']:
            continue

        # Name (usually first line or prominent, but not section headers)
        if i < 5 and len(line) > 3 and len(line) < 100 and 'developer' not in line.lower() and 'engineer' not in line.lower() and 'information' not in line.lower():
            if not parsed_data['personal'].get('full_name'):
                parsed_data['personal']['full_name'] = line
                # Split name
                name_parts = line.split()
                if len(name_parts) >= 2:
                    parsed_data['personal']['first_name'] = name_parts[0]
                    parsed_data['personal']['last_name'] = name_parts[-1]
                continue

        # Headline (look for job titles in personal section)
        if any(keyword in line.lower() for keyword in ['developer', 'engineer', 'manager', 'analyst', 'coordinator', 'specialist', 'director', 'lead', 'senior', 'junior']) and len(line) < 200:
            if not parsed_data['personal'].get('headline'):
                parsed_data['personal']['headline'] = line
                continue

        # Email
        if '@' in line and '.' in line and len(line) < 100:
            email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', line)
            if email_match:
                parsed_data['personal']['email'] = email_match.group()
                continue

        # Phone
        phone_match = re.search(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', line)
        if phone_match:
            parsed_data['personal']['phone'] = phone_match.group()
            continue

        # Location (look for city, country patterns)
        if any(keyword in line.lower() for keyword in ['japan', 'tokyo', 'california', 'san francisco', 'new york', 'london', 'paris', 'berlin', 'amsterdam', 'singapore', 'sydney', 'toronto', 'vancouver']) or re.search(r'[A-Z][a-z]+,\s*[A-Z][a-z]+', line):
            if not parsed_data['personal'].get('location'):
                parsed_data['personal']['location'] = line
                continue

    # Extract experience
    experience_section = False
    current_job = {}

    for line in lines:
        line_lower = line.lower()

        # Start experience section
        if 'experience' in line_lower or line.upper() == 'EXPERIENCE':
            experience_section = True
            continue

        # Stop at next section
        if experience_section and any(keyword in line_lower for keyword in ['education', 'skills', 'projects']) or line.upper() in ['EDUCATION', 'SKILLS', 'PROJECTS']:
            if current_job and current_job.get('title'):
                parsed_data['experience'].append(current_job)
            break

        if experience_section:
            # Skip empty lines and section headers
            if not line.strip() or line.upper() in ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS']:
                continue

            # Job title patterns (more specific)
            if any(keyword in line_lower for keyword in ['engineer', 'developer', 'manager', 'analyst', 'coordinator', 'specialist', 'director', 'lead', 'senior', 'junior', 'consultant', 'architect']):
                if current_job and current_job.get('title'):
                    parsed_data['experience'].append(current_job)
                current_job = {'title': line, 'company': '', 'dates': '', 'description': ''}
                continue

            # Company patterns (look for company indicators)
            if any(keyword in line_lower for keyword in ['inc', 'llc', 'corp', 'company', 'ltd', 'group', 'agency', 'startup', 'tech', 'systems', 'solutions']) or '•' in line:
                if current_job and not current_job.get('company'):
                    current_job['company'] = line
                continue

            # Date patterns
            if re.search(r'\b(20\d{2}|19\d{2})\b', line) or re.search(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b', line_lower):
                if current_job and not current_job.get('dates'):
                    current_job['dates'] = line
                continue

            # Description (longer text, but not bullet points)
            if len(line) > 30 and current_job and not line.startswith('•') and not line.startswith('-'):
                if current_job.get('description'):
                    current_job['description'] += ' ' + line
                else:
                    current_job['description'] = line

    # Add last job if it has a title
    if current_job and current_job.get('title'):
        parsed_data['experience'].append(current_job)

    # Extract education
    education_section = False
    current_edu = {}
    seen_education = set()

    for line in lines:
        line_lower = line.lower()

        # Start education section
        if 'education' in line_lower or line.upper() == 'EDUCATION':
            education_section = True
            continue

        # Stop at next section
        if education_section and any(keyword in line_lower for keyword in ['experience', 'skills', 'projects']) or line.upper() in ['EXPERIENCE', 'SKILLS', 'PROJECTS']:
            if current_edu and current_edu.get('school'):
                edu_key = f"{current_edu.get('school', '')}-{current_edu.get('degree', '')}"
                if edu_key not in seen_education:
                    parsed_data['education'].append(current_edu)
                    seen_education.add(edu_key)
            break

        if education_section:
            # Skip empty lines and section headers
            if not line.strip() or line.upper() in ['EDUCATION', 'EXPERIENCE', 'SKILLS', 'PROJECTS']:
                continue

            # School patterns
            if any(keyword in line_lower for keyword in ['university', 'college', 'institute', 'school']):
                if current_edu and current_edu.get('school'):
                    edu_key = f"{current_edu.get('school', '')}-{current_edu.get('degree', '')}"
                    if edu_key not in seen_education:
                        parsed_data['education'].append(current_edu)
                        seen_education.add(edu_key)
                current_edu = {'school': line, 'degree': '', 'year': ''}
                continue

            # Degree patterns
            if any(keyword in line_lower for keyword in ['bachelor', 'master', 'phd', 'mba', 'bs', 'ba', 'ms', 'ma', 'degree', 'diploma', 'certificate']):
                if current_edu and not current_edu.get('degree'):
                    current_edu['degree'] = line
                continue

            # Year patterns
            year_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
            if year_match and current_edu and not current_edu.get('year'):
                current_edu['year'] = year_match.group()

    # Add last education if not duplicate
    if current_edu and current_edu.get('school'):
        edu_key = f"{current_edu.get('school', '')}-{current_edu.get('degree', '')}"
        if edu_key not in seen_education:
            parsed_data['education'].append(current_edu)

    # Extract skills
    skills_section = False
    skills = set()

    for line in lines:
        line_lower = line.lower()

        # Start skills section
        if 'skills' in line_lower or line.upper() == 'SKILLS':
            skills_section = True
            continue

        # Stop at next section
        if skills_section and any(keyword in line_lower for keyword in ['experience', 'education', 'projects']) or line.upper() in ['EXPERIENCE', 'EDUCATION', 'PROJECTS']:
            break

        if skills_section:
            # Skip empty lines and section headers
            if not line.strip() or line.upper() in ['SKILLS', 'EXPERIENCE', 'EDUCATION', 'PROJECTS']:
                continue

            # Extract skills from line
            skill_words = re.split(r'[,•·\-\n]', line)
            for word in skill_words:
                word = word.strip()
                if len(word) > 2 and len(word) < 30:
                    skills.add(word)

    # Also look for skills throughout the text
    tech_skills = [
        'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
        'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'rails',
        'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
        'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
        'linux', 'windows', 'macos', 'bash', 'powershell'
    ]

    text_lower = text.lower()
    for skill in tech_skills:
        if skill in text_lower:
            skills.add(skill.title())

    parsed_data['skills'] = list(skills)[:20]  # Limit to 20 skills

    return parsed_data

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
    print("📡 Server will be available at: http://localhost:3000")
    print("🔗 Chrome extension should point to: http://localhost:3000/resume/parse_api")
    print("⚡ Features: PDF text extraction + OCR fallback + Advanced parsing")

    # Check dependencies
    check_system_dependencies()

    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=True
    )
