import api from '../services/api';

// Track connection test status
let connectionTested = false;
let lastTestTime = 0;
let lastAuthCheck = 0;
const TEST_INTERVAL = 300000; // 5 minutes between tests
const AUTH_CHECK_INTERVAL = 60000; // 1 minute between auth checks

// Simple API test function with rate limiting
export const testApiConnection = async (force = false) => {
  const now = Date.now();
  
  // Skip if we've already tested recently and not forcing a retry
  if (!force && (now - lastTestTime) < TEST_INTERVAL) {
    console.log(`Skipping API test - last test was ${Math.floor((now - lastTestTime)/1000)} seconds ago`);
    return connectionTested;
  }
  
  // Skip if we recently got an auth error
  if (!force && (now - lastAuthCheck) < AUTH_CHECK_INTERVAL) {
    console.log('Skipping API test - recently detected unauthorized');
    return false;
  }

  try {
    console.log('Testing API connection...');
    
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Try the health check endpoint with retry logic
    const makeRequest = async (url) => {
      try {
        const response = await api.get(url, {
          params: { _t: timestamp },
          timeout: 2000, // 2 second timeout
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        });
        
        if (response.status === 429) {
          throw { response: { status: 429 } };
        }
        
        return response;
      } catch (error) {
        if (error.response?.status === 429) {
          // If rate limited, wait and don't retry to avoid making it worse
          console.warn('⚠️ API Rate Limited - Will retry after cooldown');
          throw error;
        }
        throw error;
      }
    };

    // Try health check endpoint first
    let response;
    try {
      response = await makeRequest('/health');
      // If we got here, the request was successful
      console.log('✅ API Connection Successful!', response.status);
      connectionTested = true;
      lastTestTime = Date.now();
      return true;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Health check endpoint not found, trying public endpoint...');
        try {
          response = await makeRequest('/public/health');
          console.log('✅ Public API Connection Successful!', response.status);
          connectionTested = true;
          lastTestTime = Date.now();
          return true;
        } catch (publicError) {
          // If public endpoint also fails, continue to error handling
          throw publicError;
        }
      }
      throw error;
    }

  } catch (error) {
    const errorData = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url?.split('?')[0] // Remove query params from URL for cleaner logging
    };
    
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized - User not authenticated');
      lastAuthCheck = Date.now();
      return false;
    } else if (error.response?.status === 429) {
      console.warn('⚠️ API Rate Limited - Will retry after cooldown');
      // Don't mark as failed if rate limited - just wait for next interval
      return connectionTested;
    } else if (error.response?.status === 404) {
      console.warn('⚠️ Endpoint not found:', errorData);
    } else {
      console.error('❌ API Connection Failed:', errorData);
    }
    
    connectionTested = false;
    return false;
  }
};

// Only run in development and only if not already running in a test
if (process.env.NODE_ENV === 'development' && !window.__test__) {
  // Don't run tests immediately - let the app handle initial auth
  const initialDelay = 10000; // 10 seconds to allow for login
  console.log(`Scheduling initial API test in ${initialDelay}ms...`);
  
  let testInterval;
  
  const startTestInterval = () => {
    // Clear any existing interval
    if (testInterval) clearInterval(testInterval);
    
    // Set up periodic testing with a longer interval
    testInterval = setInterval(() => {
      testApiConnection().catch(() => {
        // Errors are already logged by testApiConnection
      });
    }, TEST_INTERVAL);
  };
  
  // Initial test after delay
  setTimeout(() => {
    testApiConnection()
      .then(success => {
        if (success) {
          console.log('Initial API test successful');
          startTestInterval();
        } else {
          console.warn('Initial API test failed - will retry later');
          // Try again in 30 seconds if not authorized
          setTimeout(() => testApiConnection().then(success => {
            if (success) startTestInterval();
          }), 30000);
        }
      });
  }, initialDelay);
  
  // Clean up interval on page unload
  if (window.addEventListener) {
    window.addEventListener('beforeunload', () => {
      if (testInterval) clearInterval(testInterval);
    });
  }
}
