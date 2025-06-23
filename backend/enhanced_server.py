"""
Enhanced Backend Server - Modular Version
Flask API for resume parsing with OCR capabilities
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from modules.resume_parser import ResumeParser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask app configuration
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'pdf'}
PORT = 3001

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def check_system_dependencies():
    """Check if required system dependencies are installed"""
    logger.info("🔍 Checking system dependencies...")

    missing_deps = []

    # Check Tesseract
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        logger.info("✅ Tesseract OCR found")
    except Exception:
        missing_deps.append("Tesseract OCR")

    # Check Poppler (for pdf2image)
    try:
        from pdf2image import convert_from_path
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

        # Parse using modular parser
        parser = ResumeParser(file_path)
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
        import pytesseract
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
