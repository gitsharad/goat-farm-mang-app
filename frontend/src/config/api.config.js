/**
 * API Configuration
 * 
 * This file contains configuration for API requests including:
 * - Base URLs for different environments
 * - Default request headers
 * - Timeout settings
 * - Retry configurations
 */

// Helper function to ensure URLs are properly formatted for the proxy
export const ensureApiPrefix = (url) => {
  // If it's a full URL, return as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Remove any leading slashes and 'api/' if it exists to prevent double prefix
  let cleanUrl = url.replace(/^\/+/g, '');
  cleanUrl = cleanUrl.replace(/^api\//, '');
  
  // Add single /api/ prefix for all API requests
  return `/api/${cleanUrl}`;
};

export const API_CONFIG = {
  // Base URL is set to /api to match backend routes
  BASE_URL: '/api',
  
  // Default request timeout in milliseconds
  TIMEOUT: 15000, // 15 seconds
  
  // Maximum number of retries for failed requests
  MAX_RETRIES: 2,
  
  // Delay between retries in milliseconds
  RETRY_DELAY: 1000,
  
  // Default headers for all requests
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Credentials': 'true'
  },
  
  // Endpoints that don't require authentication
  PUBLIC_ENDPOINTS: [
    '/auth/login',
    '/auth/refresh-token',
    '/health',
    '/subscription/plans',
    '/subscription/me'  // Add this line to make the subscription endpoint public
  ],
  
  // Endpoints that should include credentials (cookies)
  CREDENTIALS_ENDPOINTS: [
    '/auth/',
    '/subscription/'  // Ensure credentials are included for subscription endpoints
  ],
  
  // HTTP methods that can be retried
  RETRY_METHODS: ['GET', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']
};

/**
 * Check if an endpoint requires authentication
 * @param {string} url - The endpoint URL to check
 * @returns {boolean} - True if endpoint requires auth
 */
export const requiresAuth = (url) => {
  return !API_CONFIG.PUBLIC_ENDPOINTS.some(endpoint => 
    url.endsWith(endpoint) || url.includes(endpoint)
  );
};

/**
 * Check if an endpoint should include credentials
 * @param {string} url - The endpoint URL to check
 * @returns {boolean} - True if credentials should be included
 */
export const shouldIncludeCredentials = (url) => {
  return API_CONFIG.CREDENTIALS_ENDPOINTS.some(endpoint => 
    url.includes(endpoint)
  );
};

export default API_CONFIG;
