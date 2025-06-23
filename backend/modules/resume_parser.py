"""
Resume Parser Module - Extracted from enhanced_backend_server.py
Handles PDF parsing with OCR fallback and data extraction
"""

import os
import re
import logging
from io import BytesIO
import PyPDF2
import pytesseract
from PIL import Image
from pdf2image import convert_from_path

logger = logging.getLogger(__name__)

class ResumeParser:
    def __init__(self, file_path):
        self.file_path = file_path
        self.text_content = ""
        self.parsed_data = {
            'personal': {},
            'experience': [],
            'education': [],
            'skills': []
        }

    def parse(self):
        """Main parsing method with OCR fallback"""
        logger.info(f"🔍 Starting enhanced resume parsing for: {self.file_path}")

        # Step 1: Extract text from PDF
        self.extract_text_from_pdf()

        # Step 2: OCR fallback if text is minimal
        if len(self.text_content.strip()) < 100:
            logger.info("📸 Text content minimal, trying OCR...")
            self.extract_text_with_ocr()

        # Step 3: Parse structured data
        if self.text_content.strip():
            self.parse_personal_information()
            self.parse_experience()
            self.parse_education()
            self.parse_skills()
            self.clean_and_validate_data()

        logger.info(f"✅ Parsing complete. Text length: {len(self.text_content)}")
        return self.parsed_data

    def extract_text_from_pdf(self):
        """Extract text using PyPDF2"""
        try:
            with open(self.file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_parts = []

                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text.strip():
                            text_parts.append(page_text)
                            logger.info(f"📄 Extracted text from page {page_num + 1}: {len(page_text)} chars")
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to extract text from page {page_num + 1}: {e}")

                self.text_content = '\n'.join(text_parts)
                logger.info(f"✅ PDF text extraction complete: {len(self.text_content)} characters")

        except Exception as e:
            logger.error(f"❌ PDF text extraction failed: {e}")
            self.text_content = ""

    def extract_text_with_ocr(self):
        """Extract text using OCR as fallback"""
        try:
            logger.info("🔍 Starting OCR text extraction...")

            # Convert PDF to images
            images = convert_from_path(self.file_path, dpi=300)
            ocr_text_parts = []

            for i, image in enumerate(images):
                try:
                    # Perform OCR on each page
                    page_text = pytesseract.image_to_string(image, lang='eng')
                    if page_text.strip():
                        ocr_text_parts.append(page_text)
                        logger.info(f"📸 OCR extracted from page {i + 1}: {len(page_text)} chars")
                except Exception as e:
                    logger.warning(f"⚠️ OCR failed for page {i + 1}: {e}")

            if ocr_text_parts:
                self.text_content = '\n'.join(ocr_text_parts)
                logger.info(f"✅ OCR extraction complete: {len(self.text_content)} characters")
            else:
                logger.warning("⚠️ OCR extraction yielded no text")

        except Exception as e:
            logger.error(f"❌ OCR extraction failed: {e}")

    def parse_personal_information(self):
        """Parse personal information from text"""
        logger.info("👤 Parsing personal information...")

        personal = {}
        text_lower = self.text_content.lower()

        # Email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, self.text_content, re.IGNORECASE)
        if emails:
            personal['email'] = emails[0]

        # Phone extraction
        phone_patterns = [
            r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\b\d{3}[-.]?\d{4}[-.]?\d{4}\b'
        ]

        for pattern in phone_patterns:
            phones = re.findall(pattern, self.text_content)
            if phones:
                if isinstance(phones[0], tuple):
                    personal['phone'] = f"({phones[0][0]}) {phones[0][1]}-{phones[0][2]}"
                else:
                    personal['phone'] = phones[0]
                break

        # Name extraction (first few lines, excluding email/phone)
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]
        for line in lines[:5]:
            if not re.search(email_pattern, line, re.IGNORECASE) and not re.search(r'\d{3}[-.]?\d{3}[-.]?\d{4}', line):
                if len(line.split()) >= 2 and len(line) < 50:
                    personal['full_name'] = line
                    break

        # Address extraction (basic)
        address_keywords = ['street', 'ave', 'avenue', 'road', 'rd', 'drive', 'dr', 'lane', 'ln']
        for line in lines:
            if any(keyword in line.lower() for keyword in address_keywords):
                personal['address'] = line
                break

        self.parsed_data['personal'] = personal
        logger.info(f"✅ Extracted personal info: {len(personal)} fields")

    def parse_experience(self):
        """Parse work experience"""
        logger.info("💼 Parsing work experience...")

        experience = []
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]

        # Look for experience section
        experience_section = False
        current_job = {}

        for line in lines:
            line_lower = line.lower()

            # Start of experience section
            if any(keyword in line_lower for keyword in ['experience', 'employment', 'work history']):
                experience_section = True
                continue

            # Stop at next section
            if experience_section and any(keyword in line_lower for keyword in ['education', 'skills', 'projects']):
                if current_job:
                    experience.append(current_job)
                break

            if experience_section:
                # Job title and company patterns
                if re.search(r'\b(manager|director|engineer|developer|analyst|coordinator|assistant|specialist)\b', line_lower):
                    if current_job:
                        experience.append(current_job)

                    current_job = {
                        'title': line.strip(),
                        'company': '',
                        'dates': '',
                        'description': ''
                    }

                    # Extract dates
                    date_match = re.search(r'\b(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|19\d{2}|present)\b', line, re.IGNORECASE)
                    if date_match:
                        current_job['dates'] = date_match.group()

                # Company extraction
                elif current_job and not current_job.get('company'):
                    if any(indicator in line_lower for indicator in ['inc', 'corp', 'llc', 'company', 'ltd']):
                        current_job['company'] = line.strip()

        if current_job:
            experience.append(current_job)

        self.parsed_data['experience'] = experience[:5]  # Limit to 5 entries
        logger.info(f"✅ Extracted {len(experience)} work experiences")

    def parse_education(self):
        """Parse education with improved validation"""
        logger.info("🎓 Parsing education...")

        education = []
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]

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
                # Skip lines that look like work experience
                work_indicators = ['instructor', 'teacher', 'manager', 'director', 'engineer', 'developer']
                if any(indicator in line_lower for indicator in work_indicators):
                    continue

                # Institution patterns - be more specific
                if any(keyword in line_lower for keyword in ['university', 'college', 'institute']) and not any(indicator in line_lower for indicator in work_indicators):
                    edu_entry = {
                        'school': line.strip(),
                        'degree': '',
                        'year': ''
                    }

                    # Look for degree
                    if any(degree in line_lower for degree in ['bachelor', 'master', 'phd', 'mba', 'bs', 'ba', 'ms', 'ma', 'degree']):
                        edu_entry['degree'] = line.strip()

                    # Extract year
                    year_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
                    if year_match:
                        edu_entry['year'] = year_match.group()

                    education.append(edu_entry)

        self.parsed_data['education'] = education[:3]
        logger.info(f"✅ Extracted {len(education)} education entries")

    def parse_skills(self):
        """Parse skills and technologies"""
        logger.info("🛠️ Parsing skills...")

        skills = set()

        # Technical skills keywords
        tech_skills = [
            'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
            'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'rails',
            'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github'
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

            if any(keyword in line_lower for keyword in ['skills', 'technologies', 'tools']):
                skills_section = True
                continue

            if skills_section:
                if any(keyword in line_lower for keyword in ['experience', 'education', 'projects']):
                    break

                # Extract skills from lists
                skill_words = re.split(r'[,•·\-\n]', line)
                for word in skill_words:
                    word = word.strip()
                    if len(word) > 2 and len(word) < 20:
                        skills.add(word)

        self.parsed_data['skills'] = list(skills)[:20]
        logger.info(f"✅ Extracted {len(skills)} skills")

    def clean_and_validate_data(self):
        """Clean and validate parsed data"""
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
