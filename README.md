# 🚀 Resume Auto-Fill Chrome Extension

Automatically fill job application forms using your resume data. Upload your PDF resume once, then auto-fill forms on major job sites with a single click!

## ✨ Features

- **🎯 Smart Form Detection**: Automatically detects and fills common form fields
- **📄 PDF Resume Parsing**: Upload your PDF resume and extract structured data
- **🌐 Multi-Site Support**: Works on LinkedIn, Indeed, Glassdoor, Workday, and more
- **🎨 Beautiful UI**: Clean, modern interface with drag & drop upload
- **⚡ One-Click Filling**: Fill entire forms with a single button click
- **🔒 Local Storage**: Your data stays in your browser, secure and private

## 🌍 Supported Job Sites

- LinkedIn
- Indeed
- Glassdoor
- Monster
- ZipRecruiter
- Workday
- Greenhouse
- Lever

## 🛠️ Setup Instructions

### 1. Install Backend Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
# Start the PDF parsing API
python backend_server.py
```

The server will run on `http://localhost:3000`

### 3. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select this project folder
5. The extension should now appear in your Chrome toolbar

### 4. Add Extension Icons (Optional)

Create these PNG files in the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## 📖 How to Use

1. **Upload Resume**: Click the extension icon and upload your PDF resume
2. **Navigate to Job Site**: Go to any supported job application page
3. **Auto-Fill**: Click the extension icon and hit "Auto-Fill Current Page"
4. **Review & Submit**: Review the filled information and submit your application

## 🔧 Development

### Project Structure

```
resume-autofill-extension/
├── manifest.json          # Chrome extension configuration
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
├── content.js             # Content script for form filling
├── content.css            # Styling for filled fields
├── background.js          # Background script
├── backend_server.py      # PDF parsing API server
├── requirements.txt       # Python dependencies
└── icons/                 # Extension icons
```

### Key Components

- **Content Script**: Detects and fills form fields on job sites
- **Popup Interface**: Handles resume upload and triggers auto-fill
- **Backend API**: Parses PDF resumes and extracts structured data
- **Local Storage**: Stores parsed resume data securely in browser

## 🚨 Troubleshooting

### Extension Not Working
- Make sure the backend server is running on port 3000
- Check browser console for errors
- Try refreshing the job application page

### PDF Not Parsing
- Ensure your PDF contains text (not just images)
- Check that the PDF is under 10MB
- Verify backend server is running

### Form Fields Not Filling
- Different sites use different field structures
- Some fields may need manual completion
- Try refreshing the page and running auto-fill again

## 🤝 Contributing

Feel free to add support for more job sites by updating the field selectors in `content.js`!

## 📝 License

This project is for personal use. Please respect the terms of service of job sites you use it on.

---

**Happy job hunting! 🎯**
