// Configuration module
export const API_CONFIG = {
  // For development (enhanced backend)
  development: 'http://localhost:3000',
  // For production (update when you deploy)
  production: 'https://your-app.herokuapp.com'
};

// Automatically detect environment
export const API_BASE_URL = API_CONFIG.development; // 'http://localhost:3000'

// Supported sites for auto-fill
export const SUPPORTED_SITES = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'workday.com',
  'greenhouse.io',
  'lever.co',
  'wantedly.com',
  'gaijinpot.com'
];

export function isSupportedSite(url) {
  if (!url) return false;
  return SUPPORTED_SITES.some(site => url.includes(site));
}
