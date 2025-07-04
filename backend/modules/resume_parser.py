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
            'summary': '',
            'experience': [],
            'education': [],
            'skills': [],
            'technical_skills': [],
            'projects': [],
            'languages': [],
            'certifications': []
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
            self.parse_summary()
            self.parse_experience()
            self.parse_education()
            self.parse_skills()
            self.parse_projects()
            self.parse_languages()
            self.parse_certifications()
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

                    # Split into first and last name
                    name_parts = line.split()
                    if len(name_parts) >= 2:
                        personal['first_name'] = name_parts[0]
                        personal['last_name'] = name_parts[-1]
                    break

        # Address extraction (enhanced)
        address_keywords = ['street', 'ave', 'avenue', 'road', 'rd', 'drive', 'dr', 'lane', 'ln', 'blvd', 'boulevard']
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in address_keywords):
                personal['address'] = line
                break
            # Also look for city, state patterns
            elif re.search(r'\b[A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5}', line):
                personal['address'] = line
                break

        # LinkedIn URL extraction
        linkedin_pattern = r'linkedin\.com/in/[\w\-]+'
        linkedin_match = re.search(linkedin_pattern, self.text_content, re.IGNORECASE)
        if linkedin_match:
            personal['linkedin'] = 'https://' + linkedin_match.group()

        # Website/Portfolio extraction
        website_pattern = r'https?://[\w\.\-]+\.[a-z]{2,}'
        website_matches = re.findall(website_pattern, self.text_content, re.IGNORECASE)
        if website_matches:
            for url in website_matches:
                if 'linkedin' not in url.lower():  # Exclude LinkedIn URLs
                    personal['website'] = url
                    break

        self.parsed_data['personal'] = personal
        logger.info(f"✅ Extracted personal info: {', '.join(personal.keys())}")

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

        all_skills = set()
        technical_skills = set()

        # Technical skills keywords
        tech_skills_list = [
            'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
            'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'rails',
            'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
            'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'matplotlib',
            'linux', 'windows', 'macos', 'unix', 'bash', 'powershell'
        ]

        # Soft skills keywords
        soft_skills_list = [
            'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
            'creative', 'adaptable', 'organized', 'detail-oriented', 'time management',
            'project management', 'customer service', 'presentation', 'negotiation'
        ]

        text_lower = self.text_content.lower()

        # Find technical skills mentioned in text
        for skill in tech_skills_list:
            if skill in text_lower:
                technical_skills.add(skill.title())
                all_skills.add(skill.title())

        # Find soft skills mentioned in text
        for skill in soft_skills_list:
            if skill in text_lower:
                all_skills.add(skill.title())

        # Look for skills section
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]
        skills_section = False
        technical_section = False

        for line in lines:
            line_lower = line.lower()

            if any(keyword in line_lower for keyword in ['skills', 'technologies', 'tools', 'technical skills']):
                skills_section = True
                if 'technical' in line_lower:
                    technical_section = True
                continue

            if skills_section:
                if any(keyword in line_lower for keyword in ['experience', 'education', 'projects', 'languages']):
                    skills_section = False
                    technical_section = False
                    continue

                # Extract skills from lists
                skill_words = re.split(r'[,•·\-\n|/]', line)
                for word in skill_words:
                    word = word.strip()
                    if len(word) > 2 and len(word) < 25:
                        all_skills.add(word)

                        # Check if it's a technical skill
                        if technical_section or any(tech in word.lower() for tech in tech_skills_list):
                            technical_skills.add(word)

        self.parsed_data['skills'] = list(all_skills)[:25]
        self.parsed_data['technical_skills'] = list(technical_skills)[:15]
        logger.info(f"✅ Extracted {len(all_skills)} total skills, {len(technical_skills)} technical skills")

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

    def parse_summary(self):
        """Parse professional summary or objective"""
        logger.info("📝 Parsing summary/objective...")

        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]
        summary_text = ""

        # Look for summary section
        summary_section = False
        summary_lines = []

        for i, line in enumerate(lines):
            line_lower = line.lower()

            # Start of summary section
            if any(keyword in line_lower for keyword in ['summary', 'objective', 'profile', 'about']):
                summary_section = True
                continue

            # Stop at next section
            if summary_section and any(keyword in line_lower for keyword in ['experience', 'education', 'skills', 'employment']):
                break

            if summary_section and line and len(line) > 20:
                summary_lines.append(line)

        if summary_lines:
            summary_text = ' '.join(summary_lines[:3])  # Limit to first 3 lines

        self.parsed_data['summary'] = summary_text
        logger.info(f"✅ Extracted summary: {len(summary_text)} characters")

    def parse_projects(self):
        """Parse projects section"""
        logger.info("🚀 Parsing projects...")

        projects = []
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]

        projects_section = False
        current_project = {}

        for line in lines:
            line_lower = line.lower()

            # Start of projects section
            if any(keyword in line_lower for keyword in ['projects', 'portfolio']):
                projects_section = True
                continue

            # Stop at next section
            if projects_section and any(keyword in line_lower for keyword in ['experience', 'education', 'skills']):
                if current_project:
                    projects.append(current_project)
                break

            if projects_section:
                # Project title (usually standalone lines with specific patterns)
                if line and not line.startswith('-') and not line.startswith('•'):
                    if current_project:
                        projects.append(current_project)

                    current_project = {
                        'name': line.strip(),
                        'description': '',
                        'technologies': []
                    }

                # Project description (usually bullet points)
                elif current_project and (line.startswith('-') or line.startswith('•')):
                    if not current_project['description']:
                        current_project['description'] = line.strip()

        if current_project:
            projects.append(current_project)

        self.parsed_data['projects'] = projects[:5]  # Limit to 5 projects
        logger.info(f"✅ Extracted {len(projects)} projects")

    def parse_languages(self):
        """Parse languages section"""
        logger.info("🌐 Parsing languages...")

        languages = []
        text_lower = self.text_content.lower()

        # Common languages
        language_list = [
            'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese',
            'japanese', 'korean', 'arabic', 'russian', 'hindi', 'mandarin', 'cantonese'
        ]

        # Look for languages section
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]
        languages_section = False

        for line in lines:
            line_lower = line.lower()

            if any(keyword in line_lower for keyword in ['languages', 'language']):
                languages_section = True
                continue

            if languages_section:
                if any(keyword in line_lower for keyword in ['experience', 'education', 'skills', 'projects']):
                    break

                # Extract languages from the line
                for lang in language_list:
                    if lang in line_lower:
                        # Check for proficiency level
                        proficiency = 'conversational'
                        if any(level in line_lower for level in ['native', 'fluent']):
                            proficiency = 'fluent'
                        elif any(level in line_lower for level in ['basic', 'beginner']):
                            proficiency = 'basic'

                        languages.append({
                            'language': lang.title(),
                            'proficiency': proficiency
                        })

        self.parsed_data['languages'] = languages
        logger.info(f"✅ Extracted {len(languages)} languages")

    def parse_certifications(self):
        """Parse certifications and licenses"""
        logger.info("🏆 Parsing certifications...")

        certifications = []
        lines = [line.strip() for line in self.text_content.split('\n') if line.strip()]

        certifications_section = False

        for line in lines:
            line_lower = line.lower()

            # Start of certifications section
            if any(keyword in line_lower for keyword in ['certifications', 'certificates', 'licenses']):
                certifications_section = True
                continue

            # Stop at next section
            if certifications_section and any(keyword in line_lower for keyword in ['experience', 'education', 'skills', 'projects']):
                break

            if certifications_section or any(cert in line_lower for cert in ['certified', 'certificate', 'license']):
                if line and len(line) > 5:
                    cert_entry = {
                        'name': line.strip(),
                        'issuer': '',
                        'year': ''
                    }

                    # Extract year
                    year_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
                    if year_match:
                        cert_entry['year'] = year_match.group()

                    certifications.append(cert_entry)

        self.parsed_data['certifications'] = certifications[:5]  # Limit to 5 certifications
        logger.info(f"✅ Extracted {len(certifications)} certifications")
