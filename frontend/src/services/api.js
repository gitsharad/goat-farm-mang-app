import axios from 'axios';
import { toast } from 'react-toastify';
import API_CONFIG, { requiresAuth, shouldIncludeCredentials, ensureApiPrefix } from '../config/api.config';

// Queue for rate-limited requests
const requestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 300; // 300ms between requests to avoid rate limiting

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    // Remove Cache-Control from default headers as it can cause CORS issues
    // Cache control should be handled per-request instead
  },
  withCredentials: true,
  crossDomain: true,
  responseType: 'json',
  responseEncoding: 'utf8',
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  // Cache-busting will be handled in the request interceptor for GET requests only
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Resolve only if the status code is less than 500
  }
});

// Process the request queue
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  // Wait if needed to respect minimum interval
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  const { config, resolve, reject } = requestQueue.shift();
  lastRequestTime = Date.now();
  
  try {
    const response = await axios.request(config);
    resolve(response);
  } catch (error) {
    reject(error);
  } finally {
    isProcessingQueue = false;
    processQueue(); // Process next request in queue
  }
};

// Add request to queue and process it
const enqueueRequest = (config) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ config, resolve, reject });
    processQueue();
  });
};

// Single request interceptor for all request modifications
api.interceptors.request.use(
  async (config) => {
    // Ensure the URL is properly formatted with /api prefix for all relative URLs
    if (!config.url.startsWith('http')) {
      // Always ensure the URL has the /api prefix for relative URLs
      config.url = ensureApiPrefix(config.url);
    }
    
    // Add auth token if required
    if (requiresAuth(config.url)) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Handle CORS
    config.withCredentials = shouldIncludeCredentials(config.url);
    
    // Add cache-busting for GET requests only
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Ensure proper content type for non-GET requests with data
    if (config.data && config.method !== 'get') {
      config.headers['Content-Type'] = 'application/json';
      // Ensure data is properly stringified for JSON requests
      if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data = JSON.stringify(config.data);
      }
    }

    // Log request config in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request Config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
        withCredentials: config.withCredentials
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and CORS
// Response interceptor for handling errors and rate limiting
api.interceptors.response.use(
  (response) => {
    // Log response details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response received:', {
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
    }
    
    // Log CORS headers in development
    if (process.env.NODE_ENV === 'development') {
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers']
      };
      
      console.log('Response Headers:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        method: response.config.method,
        corsHeaders: corsHeaders
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle rate limiting (429) with retry logic
    if (error.response?.status === 429 && !originalRequest._retry) {
      const retryAfter = error.response.headers['retry-after'] || 1;
      console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
      
      // Mark request as retried
      originalRequest._retry = true;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry the request
      return api(originalRequest);
    }
    
    // Handle other errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          status,
          url: originalRequest.url,
          method: originalRequest.method,
          error: data?.message || 'Unknown error',
        });
      }

      // Handle specific status codes
      switch (status) {
        case 401: // Unauthorized
          if (window.location.pathname !== '/login') {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/login';
          }
          break;
          
        case 403: // Forbidden
          toast.error(data?.message || 'You do not have permission to perform this action.');
          break;
          
        case 404: // Not Found
          console.error('Resource not found:', originalRequest.url);
          break;
          
        case 500: // Server Error
          toast.error('A server error occurred. Please try again later.');
          break;
          
        default:
          toast.error(data?.message || 'An error occurred. Please try again.');
      }
      
      // For 401 and 403, clear any cached data
      if ([401, 403].includes(status)) {
        // Clear sensitive data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      toast.error('Unable to connect to the server. Please check your internet connection.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      toast.error('An error occurred while setting up the request.');
    }

    return Promise.reject(error);
  }
);

// Helper function for making API calls with retry logic
export const apiRequest = async (config, maxRetries = 3, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
    // Only retry on network errors or 5xx server errors
    const shouldRetry = 
      !error.response || 
      (error.response.status >= 500 && error.response.status < 600);
      
    if (shouldRetry && retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`Retry ${retryCount + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest(config, maxRetries, retryCount + 1);
    }
    throw error;
  }
};

// Export the enhanced API instance
export default api;