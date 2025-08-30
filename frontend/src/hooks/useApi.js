import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

/**
 * Custom hook for making API requests with loading and error states
 * @param {Object} options - Configuration options
 * @param {Function} [options.onSuccess] - Callback for successful requests
 * @param {Function} [options.onError] - Callback for failed requests
 * @param {boolean} [options.skip=false] - Skip the initial request
 * @returns {Object} - API call function and state
 */
const useApi = ({
  onSuccess,
  onError,
  skip = false,
} = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Make an API request
   * @param {string} method - HTTP method (get, post, put, delete, etc.)
   * @param {string} url - API endpoint
   * @param {Object} [requestData] - Request payload
   * @param {Object} [config] - Axios request config
   * @returns {Promise} - Promise that resolves with the response data
   */
  const callApi = useCallback(async (method, url, requestData = null, config = {}) => {
    // Skip if component is unmounted
    if (!isMounted.current) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await api({
        method,
        url,
        data: requestData,
        ...config,
      });

      if (isMounted.current) {
        setData(response.data);
        if (onSuccess) {
          onSuccess(response.data, response);
        }
        return response.data;
      }
    } catch (err) {
      if (isMounted.current) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        
        if (onError) {
          onError(err, errorMessage);
        } else if (err.response?.status !== 401) {
          // Don't show toast for 401 as it's handled by the interceptor
          toast.error(errorMessage);
        }
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [onSuccess, onError]);

  /**
   * Shortcut for GET requests
   */
  const get = useCallback((url, config = {}) => 
    callApi('get', url, null, config)
  , [callApi]);

  /**
   * Shortcut for POST requests
   */
  const post = useCallback((url, data, config = {}) => 
    callApi('post', url, data, config)
  , [callApi]);

  /**
   * Shortcut for PUT requests
   */
  const put = useCallback((url, data, config = {}) => 
    callApi('put', url, data, config)
  , [callApi]);

  /**
   * Shortcut for DELETE requests
   */
  const del = useCallback((url, config = {}) => 
    callApi('delete', url, null, config)
  , [callApi]);

  // Initial data fetch if needed
  useEffect(() => {
    if (!skip) {
      // You can add automatic data fetching logic here if needed
    }
  }, [skip]);

  return {
    // State
    data,
    error,
    loading,
    
    // Methods
    callApi,
    get,
    post,
    put,
    delete: del,
    
    // State setters
    setData,
    setError,
  };
};

export default useApi;
