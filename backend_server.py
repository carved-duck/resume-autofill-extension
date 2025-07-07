#!/usr/bin/env python3
"""
Resume Auto-Fill Backend Server
Provides PDF parsing API for the Chrome extension
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import re
import json
import os
from werkzeug.utils import secure_filename
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    print(f"🔍 [PDF] Starting text extraction from: {file_path}")
    text = ""
    try:
        with open(file_path, 'rb') as file:
            print(f"🔍 [PDF] Opening PDF file...")
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"🔍 [PDF] PDF has {len(pdf_reader.pages)} pages")

            for i, page in enumerate(pdf_reader.pages):
                print(f"🔍 [PDF] Extracting text from page {i+1}...")
                page_text = page.extract_text()
                print(f"🔍 [PDF] Page {i+1} text length: {len(page_text)} characters")
                text += page_text + "\n"

        print(f"✅ [PDF] Text extraction completed, total length: {len(text)} characters")
        return text
    except Exception as e:
        print(f"❌ [PDF] Error reading PDF: {e}")
        print(f"❌ [PDF] Exception type: {type(e).__name__}")
        import traceback
        print(f"❌ [PDF] Full traceback:")
        traceback.print_exc()
        return None

def parse_resume_text(text):
    """Parse resume text and extract structured data"""

    # Initialize data structure
    data = {
        'personal': {},
        'experience': [],
        'education': [],
        'skills': []
    }

    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    if emails:
        data['personal']['email'] = emails[0]

    # Extract phone numbers
    phone_patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    ]
    for pattern in phone_patterns:
        phones = re.findall(pattern, text)
        if phones:
            data['personal']['phone'] = phones[0]
            break

    # Extract name (first line that looks like a name)
    lines = text.split('\n')
    for line in lines[:5]:  # Check first 5 lines
        line = line.strip()
        if len(line) > 2 and len(line) < 50:
            # Check if it looks like a name (letters and spaces only, 2-4 words)
            if re.match(r'^[A-Za-z\s]+$', line):
                words = line.split()
                if 2 <= len(words) <= 4:
                    data['personal']['full_name'] = line
                    data['personal']['first_name'] = words[0]
                    data['personal']['last_name'] = words[-1]
                    break

    # Extract LinkedIn
    linkedin_pattern = r'linkedin\.com/in/[\w-]+'
    linkedin_matches = re.findall(linkedin_pattern, text, re.IGNORECASE)
    if linkedin_matches:
        data['personal']['linkedin'] = f"https://{linkedin_matches[0]}"

    # Extract GitHub
    github_pattern = r'github\.com/[\w-]+'
    github_matches = re.findall(github_pattern, text, re.IGNORECASE)
    if github_matches:
        data['personal']['github'] = f"https://{github_matches[0]}"

    # Extract education (simplified)
    education_keywords = ['university', 'college', 'institute', 'school', 'bachelor', 'master', 'phd', 'degree']
    education_section = False
    for line in lines:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in ['education', 'academic']):
            education_section = True
            continue

        if education_section and any(keyword in line_lower for keyword in education_keywords):
            # Try to extract school and degree
            words = line.strip().split()
            if len(words) > 1:
                data['education'].append({
                    'school': line.strip(),
                    'degree': 'Degree',  # Simplified
                    'year': ''
                })
                if len(data['education']) >= 3:  # Limit to 3 entries
                    break

    # Extract experience (simplified)
    job_titles = ['engineer', 'developer', 'manager', 'analyst', 'coordinator', 'specialist', 'director']
    for line in lines:
        line_clean = line.strip()
        if len(line_clean) > 5:
            if any(title in line_clean.lower() for title in job_titles):
                # This is likely a job title
                data['experience'].append({
                    'title': line_clean,
                    'company': 'Company Name',  # Simplified
                    'duration': '2020-2023',
                    'description': 'Job description'
                })
                if len(data['experience']) >= 3:  # Limit to 3 entries
                    break

    # Extract skills (simplified)
    skills_keywords = ['python', 'javascript', 'react', 'node', 'java', 'sql', 'aws', 'docker', 'git']
    text_lower = text.lower()
    for skill in skills_keywords:
        if skill in text_lower:
            data['skills'].append(skill.title())

    return data

@app.route('/resume/parse_api', methods=['POST'])
def parse_resume():
    """Parse uploaded resume PDF"""

    print(f"🔍 [API] Received resume upload request")
    print(f"🔍 [API] Request files: {list(request.files.keys())}")
    print(f"🔍 [API] Request headers: {dict(request.headers)}")

    if 'resume_file' not in request.files:
        print(f"❌ [API] No resume_file in request.files")
        return jsonify({
            'success': False,
            'error': 'No file uploaded'
        }), 400

    file = request.files['resume_file']
    print(f"🔍 [API] File received: {file.filename}, size: {file.content_length if hasattr(file, 'content_length') else 'unknown'}")

    if file.filename == '':
        print(f"❌ [API] Empty filename")
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400

    if not allowed_file(file.filename):
        print(f"❌ [API] Invalid file type: {file.filename}")
        return jsonify({
            'success': False,
            'error': 'Only PDF files are allowed'
        }), 400

    file_path = None
    try:
        print(f"🔍 [API] Starting PDF processing...")

        # Save uploaded file temporarily
        filename = secure_filename(file.filename or "unknown.pdf")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        print(f"🔍 [API] Saving file to: {file_path}")

        file.save(file_path)
        print(f"✅ [API] File saved successfully")

        # Check if file exists and has content
        if not os.path.exists(file_path):
            print(f"❌ [API] File was not saved properly")
            return jsonify({
                'success': False,
                'error': 'Failed to save uploaded file'
            }), 500

        file_size = os.path.getsize(file_path)
        print(f"🔍 [API] Saved file size: {file_size} bytes")

        # Extract text from PDF
        print(f"🔍 [API] Extracting text from PDF...")
        text = extract_text_from_pdf(file_path)

        if text:
            print(f"✅ [API] Text extraction successful, length: {len(text)} characters")
            print(f"🔍 [API] First 200 chars: {text[:200]}...")
        else:
            print(f"❌ [API] Text extraction failed - no text extracted")
            return jsonify({
                'success': False,
                'error': 'Could not extract text from PDF'
            }), 400

        # Parse the extracted text
        print(f"🔍 [API] Parsing extracted text...")
        parsed_data = parse_resume_text(text)
        print(f"✅ [API] Parsing successful")
        print(f"🔍 [API] Parsed data keys: {list(parsed_data.keys())}")
        for key, value in parsed_data.items():
            if isinstance(value, list):
                print(f"🔍 [API] {key}: {len(value)} items")
            else:
                print(f"🔍 [API] {key}: {value}")

        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"✅ [API] Temporary file cleaned up")

        print(f"✅ [API] Processing completed successfully")
        return jsonify({
            'success': True,
            'data': parsed_data,
            'message': 'Resume parsed successfully'
        })

    except Exception as e:
        print(f"❌ [API] Exception occurred: {str(e)}")
        print(f"❌ [API] Exception type: {type(e).__name__}")
        import traceback
        print(f"❌ [API] Full traceback:")
        traceback.print_exc()

        # Clean up temp file if it exists
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"✅ [API] Cleaned up temp file after error")
            except Exception as cleanup_error:
                print(f"⚠️ [API] Failed to cleanup temp file: {cleanup_error}")

        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Resume Auto-Fill API is running'
    })

if __name__ == '__main__':
    print("🚀 Starting Resume Auto-Fill API Server...")
    print("📡 Server will be available at: http://localhost:3000")
    print("🔗 Chrome extension should point to: http://localhost:3000/resume/parse_api")

    app.run(
        host='0.0.0.0',
        port=3000,
        debug=True
    )
