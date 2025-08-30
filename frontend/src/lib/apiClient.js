import { logInfo, logError, logDebug } from '../utils/logger';

const API_BASE_URL = 'http://localhost:5000/api'; // Backend server URL with /api prefix

// Helper function to refresh the access token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const { token, refreshToken: newRefreshToken, user } = await response.json();
  
  // Update tokens in storage
  localStorage.setItem('token', token);
  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  return token;
}

// Helper function to make authenticated requests with token refresh
async function fetchWithAuth(input, init = {}) {
  logDebug('Starting API request', { input, path: window.location.pathname });
  
  // Set up headers
  const headers = {
    'Content-Type': 'application/json',
    ...init.headers,
  };

  // Add auth header if token exists
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  logDebug('Auth tokens', { 
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    path: input.toString(),
    method: init.method || 'GET'
  });
  
  if (token) {
    logDebug('Auth token found');
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    logDebug('No auth token found');
  }

  // Remove any duplicate /api prefix from the input
  const cleanInput = input.startsWith('/api/') ? input.substring(4) : input;
  const fullUrl = `${API_BASE_URL}${cleanInput}`;
  logDebug('Final request URL', { fullUrl, cleanInput });

  try {
    // Make the initial request
    logDebug('Making request', { url: fullUrl, method: init.method || 'GET' });
    let response = await fetch(fullUrl, {
      ...init,
      headers,
      credentials: 'include',
    });

    logDebug('Response received', {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl
    });
    
    if (!response.ok) {
      logError('API request failed', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        method: init.method || 'GET'
      });
      
      // If unauthorized, try to refresh token and retry
      if (response.status === 401 && token) {
        logDebug('Attempting token refresh due to 401');
        logDebug('Received 401, checking for refresh token...');
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            logDebug('Attempting to refresh token...');
            const newToken = await refreshAccessToken();
            
            // Update the original request with the new token
            headers['Authorization'] = `Bearer ${newToken}`;
            logDebug('Token refreshed, retrying request...');
            
            // Retry the original request with the new token
            response = await fetch(fullUrl, {
              ...init,
              headers,
              credentials: 'include',
            });
            logDebug('Retry response received', {
              status: response.status,
              statusText: response.statusText,
              url: fullUrl
            });
          } catch (error) {
            logError('Token refresh failed', { 
              error: error.message,
              hasRefreshToken: !!refreshToken
            });
            
            // Only redirect if we're not already on the login page
            if (!window.location.pathname.includes('/login')) {
              const redirectUrl = window.location.pathname + window.location.search;
              logDebug('Redirecting to login', { from: window.location.pathname });
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
            }
            throw error;
          }
        } else {
          logDebug('No refresh token available');
          if (window.location.pathname !== '/login') {
            logDebug('Redirecting to login - no refresh token');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return response;
  } catch (error) {
    logError('API request failed', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : undefined,
      request: error.request,
      config: error.config
    });
    throw error;
  }
}

export default fetchWithAuth;
