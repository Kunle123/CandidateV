console.log('--- api/utils.js loaded ---');
import apiClient from './apiClient';

/**
 * Utility functions for API services
 */

/**
 * Retry a failed API request with exponential backoff
 * @param {Function} apiCall - The API call function to retry
 * @param {Object} options - Options for retrying
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if retry should happen (default: retry on network errors only)
 * @returns {Promise} - The result of the API call
 */
export const retryApiCall = async (apiCall, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => !error.response // Retry only on network errors by default
  } = options;
  
  let retries = 0;
  let delay = initialDelay;
  
  const execute = async () => {
    try {
      return await apiCall();
    } catch (error) {
      if (retries >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Increment retry count
      retries++;
      
      // Calculate exponential backoff delay
      delay = Math.min(delay * 2, maxDelay);
      
      // Log retry attempt
      console.log(`Retrying API call (${retries}/${maxRetries}) after ${delay}ms`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the call
      return execute();
    }
  };
  
  return execute();
};

/**
 * Batch multiple API requests and handle them efficiently
 * @param {Array} requests - Array of request objects {method, url, data}
 * @param {Object} options - Batch options
 * @param {boolean} options.parallel - Whether to run requests in parallel (default: true)
 * @param {number} options.concurrency - Max number of parallel requests if parallel=true (default: 5)
 * @returns {Promise<Array>} - Array of responses
 */
export const batchRequests = async (requests = [], options = {}) => {
  const { 
    parallel = true, 
    concurrency = 5 
  } = options;
  
  if (!requests.length) return [];
  
  // For sequential processing
  if (!parallel) {
    const results = [];
    for (const request of requests) {
      const { method = 'get', url, data, params } = request;
      try {
        const response = await apiClient({
          method,
          url,
          data,
          params
        });
        results.push({ success: true, data: response.data });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.response?.data?.detail || error.message 
        });
      }
    }
    return results;
  }
  
  // For parallel processing with concurrency limit
  const results = [];
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchPromises = batch.map(request => {
      const { method = 'get', url, data, params } = request;
      return apiClient({
        method,
        url,
        data,
        params
      })
      .then(response => ({ success: true, data: response.data }))
      .catch(error => ({ 
        success: false, 
        error: error.response?.data?.detail || error.message 
      }));
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Format API error messages for display
 * @param {Error} error - The error object from a failed API call
 * @returns {string} - Formatted error message
 */
export const formatApiError = (error) => {
  if (!error) return 'Unknown error occurred';
  
  // Handle Axios error objects
  if (error.response) {
    // The server responded with an error status
    const status = error.response.status;
    const detail = error.response.data?.detail;
    
    if (detail) return detail;
    
    switch (status) {
      case 400: return 'Invalid request data';
      case 401: return 'You need to log in to access this resource';
      case 403: return 'You don\'t have permission to access this resource';
      case 404: return 'The requested resource was not found';
      case 422: return 'The request data is invalid';
      case 429: return 'Too many requests, please try again later';
      case 500: return 'An internal server error occurred';
      default: return `Server error (${status})`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response from server, please check your connection';
  } else {
    // Something happened in setting up the request
    return error.message || 'Unknown error occurred';
  }
};

/**
 * Gets the auth token from localStorage and returns the auth header
 * 
 * @returns {Object} The authentication header with the Bearer token
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`
  };
};

/**
 * Helper to handle API errors consistently
 *
 * @param {Error} error - The error from the API call
 * @param {string} defaultMessage - Default message to show if no specific error message is available
 * @returns {string} A formatted error message
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    const serverError = error.response.data;
    if (serverError.detail) {
      return serverError.detail;
    } else if (serverError.message) {
      return serverError.message;
    } else if (typeof serverError === 'string') {
      return serverError;
    }
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response received from server. Please check your internet connection.';
  }
  
  // Something else happened in setting up the request
  return defaultMessage;
};

/**
 * Creates a file download from a blob response
 * 
 * @param {Blob} blob - The blob data to download
 * @param {string} filename - The name of the file to be downloaded
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default {
  retryApiCall,
  batchRequests,
  formatApiError,
  getAuthHeader,
  handleApiError,
  downloadFile
}; 