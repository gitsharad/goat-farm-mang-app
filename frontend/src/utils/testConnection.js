import api from '../services/api';

// Track connection test status
let connectionTested = false;
let lastTestTime = 0;
let lastAuthCheck = 0;
let rateLimitedUntil = 0;
const TEST_INTERVAL = 300000; // 5 minutes between tests
const AUTH_CHECK_INTERVAL = 60000; // 1 minute between auth checks
const RATE_LIMIT_BACKOFF = 60000; // 1 minute base backoff time
const MAX_RETRIES = 3; // Maximum number of retry attempts

// Simple API test function with rate limiting
export const testApiConnection = async (force = false, retryCount = 0) => {
  const now = Date.now();
  
  // Skip if we're rate limited
  if (now < rateLimitedUntil) {
    const remainingSeconds = Math.ceil((rateLimitedUntil - now) / 1000);
    console.log(`⏳ API rate limited. Resuming in ${remainingSeconds} seconds...`);
    return false;
  }
  
  // Skip if we've already tested recently and not forcing a retry
  if (!force && (now - lastTestTime) < TEST_INTERVAL) {
    console.log(`⏭️ Skipping API test - last test was ${Math.floor((now - lastTestTime)/1000)} seconds ago`);
    return connectionTested;
  }
  
  // Skip if we recently got an auth error
  if (!force && (now - lastAuthCheck) < AUTH_CHECK_INTERVAL) {
    console.log('🔒 Skipping API test - recently detected unauthorized');
    return false;
  }

  try {
    console.log('Testing API connection...');
    
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Try the health check endpoint with retry logic
    const makeRequest = async (url, attempt = 1) => {
      // Ensure URL is properly formatted without double /api prefix
      let cleanUrl = url.replace(/^\/+/, ''); // Remove leading slashes
      cleanUrl = cleanUrl.replace(/^api\//, ''); // Remove existing api/ prefix if any
      try {
        // Add jitter to avoid thundering herd problem
        const jitter = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, jitter));
        
        const response = await api.get(cleanUrl, {
          params: { _t: timestamp },
          timeout: 5000, // Increased timeout to 5 seconds
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Retry-Attempt': attempt,
            'X-Retry-Max': MAX_RETRIES
          },
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        });
        
        return response;
      } catch (error) {
        if (error.response?.status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'] || 30;
          rateLimitedUntil = Date.now() + (retryAfter * 1000);
          
          if (attempt < MAX_RETRIES) {
            const backoffTime = Math.min(
              Math.pow(2, attempt) * 1000 + Math.random() * 1000, // Exponential backoff with jitter
              30000 // Max 30 seconds
            );
            
            console.warn(`⏱️ API Rate Limited (Attempt ${attempt}/${MAX_RETRIES}) - Retrying in ${Math.ceil(backoffTime/1000)}s`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return makeRequest(url, attempt + 1);
          }
          
          console.error(`❌ Max retries (${MAX_RETRIES}) reached for API request`);
        } else if (error.code === 'ECONNABORTED') {
          console.warn(`⏱️ Request timeout (Attempt ${attempt}/${MAX_RETRIES})`);
          if (attempt < MAX_RETRIES) {
            const backoffTime = Math.min(1000 * attempt, 10000); // Linear backoff up to 10s
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return makeRequest(url, attempt + 1);
          }
        }
        throw error;
      }
    };

    // Test endpoints sequentially to avoid overwhelming the server
    let healthRes, authRes;
    try {
      // Try main health check first
      healthRes = await makeRequest('/api/health');
      console.log('✅ Health check successful');
      
      // Only check auth if health check succeeds
      try {
        authRes = await makeRequest('/api/auth/me');
      } catch (authError) {
        console.log('⚠️ Auth check failed (may be expected if not logged in)');
        authRes = null;
      }
      
      connectionTested = true;
      lastTestTime = Date.now();
      return true;
      
    } catch (error) {
      console.error('❌ Main API connection test failed, trying public endpoint...');
      
      try {
        // Try public health endpoint as fallback
        const response = await makeRequest('/public/health');
        console.log('✅ Public API Connection Successful!', response.status);
        connectionTested = true;
        lastTestTime = Date.now();
        return true;
      } catch (publicError) {
        console.error('❌ Public API connection also failed');
        throw error; // Throw the original error, not the public endpoint error
      }
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
