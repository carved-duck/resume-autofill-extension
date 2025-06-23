// API Client module for backend communication
import { API_BASE_URL } from './config.js';

export class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async uploadResume(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('Please select a PDF file');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }

    const formData = new FormData();
    formData.append('resume_file', file);

    try {
      const response = await fetch(`${this.baseUrl}/resume/parse_api`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      return data.data;
    } catch (error) {
      console.error('Upload error:', error);

      let errorMessage = 'Failed to parse resume. ';
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Please make sure your backend server is running.';
      } else {
        errorMessage += error.message;
      }

      throw new Error(errorMessage);
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
