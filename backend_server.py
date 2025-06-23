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
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None
    return text

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
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{filename}")
        file.save(file_path)

        # Extract text from PDF
        text = extract_text_from_pdf(file_path)

        # Clean up temp file
        os.remove(file_path)

        if not text:
            return jsonify({
                'success': False,
                'error': 'Could not extract text from PDF'
            }), 400

        # Parse the extracted text
        parsed_data = parse_resume_text(text)

        return jsonify({
            'success': True,
            'data': parsed_data,
            'message': 'Resume parsed successfully'
        })

    except Exception as e:
        # Clean up temp file if it exists
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)

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
