import axios from 'axios';
import { toast } from 'react-toastify';
import API_CONFIG, { requiresAuth, shouldIncludeCredentials } from '../config/api.config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor for adding auth token and handling CORS
api.interceptors.request.use(
  (config) => {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        withCredentials: config.withCredentials,
        headers: config.headers
      });
    }

    // Add auth token if required
    if (requiresAuth(config.url)) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('[API] No auth token found for protected endpoint:', config.url);
      }
    }

    // Ensure credentials are included for all requests
    config.withCredentials = true;
    
    // Add cache-busting for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Log request config in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request Config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
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
api.interceptors.response.use(
  (response) => {
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
    
    // Handle other errors
    if (error.response) {
      // Server responded with a status code outside 2xx
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          toast.error(data.message || 'Bad request');
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
          
        case 404:
          toast.error('The requested resource was not found');
          break;
          
        case 429: {
          const retryAfter = error.response.headers['retry-after'] || 1;
          toast.error(`Too many requests. Please wait ${retryAfter} seconds.`);
          break;
        }
        
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data?.message || 'An error occurred');
      }
      
      // Log CORS errors
      if (status === 0) {
        console.error('CORS Error - Request was blocked:', {
          url: originalRequest.url,
          method: originalRequest.method,
          withCredentials: originalRequest.withCredentials,
          headers: originalRequest.headers,
        });
      }
      
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      toast.error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      toast.error('Error setting up request');
    }
    
    return Promise.reject(error);
  }
);

export default api;