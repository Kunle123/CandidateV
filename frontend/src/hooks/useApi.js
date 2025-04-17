import { useState, useCallback } from 'react';
import { formatApiError, retryApiCall } from '../api/utils';
import { useToast } from '@chakra-ui/react';

/**
 * Custom hook for making API calls with loading state, error handling, and optional retrying
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.showToast - Whether to show toast messages on error
 * @param {boolean} options.showSuccessToast - Whether to show toast messages on success
 * @param {string} options.successToastTitle - Default success toast title
 * @param {string} options.errorToastTitle - Default error toast title
 * @param {number} options.maxRetries - Maximum number of retries for retryable calls
 * @returns {Object} Hook methods and state
 */
const useApi = (options = {}) => {
  const {
    showToast = true,
    showSuccessToast = false,
    successToastTitle = 'Success',
    errorToastTitle = 'Error',
    maxRetries = 3
  } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const toast = useToast();
  
  /**
   * Execute an API call with error handling
   * @param {Function} apiCall - The API function to call
   * @param {Object} callOptions - Options for this specific call
   * @returns {Object} - Result of the API call with success flag
   */
  const execute = useCallback(async (apiCall, callOptions = {}) => {
    const {
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      showLoadingState = true,
      resetErrorOnCall = true,
      retryOnNetworkError = false
    } = callOptions;
    
    if (showLoadingState) {
      setLoading(true);
    }
    
    if (resetErrorOnCall) {
      setError(null);
    }
    
    try {
      // Determine whether to use retry or direct call
      const result = retryOnNetworkError 
        ? await retryApiCall(apiCall, { maxRetries }) 
        : await apiCall();
      
      if (result.success) {
        setData(result.data);
        
        if (showSuccessToast && successMessage) {
          toast({
            title: successToastTitle,
            description: successMessage,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        setError(result.error);
        
        if (showToast) {
          toast({
            title: errorToastTitle,
            description: errorMessage || result.error,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        
        if (onError) {
          onError(result.error);
        }
      }
      
      return result;
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      
      if (showToast) {
        toast({
          title: errorToastTitle,
          description: errorMessage || errorMsg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      if (onError) {
        onError(errorMsg);
      }
      
      return { success: false, error: errorMsg };
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [toast, showToast, showSuccessToast, successToastTitle, errorToastTitle, maxRetries]);
  
  /**
   * Clear any stored error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Clear any stored data
   */
  const clearData = useCallback(() => {
    setData(null);
  }, []);
  
  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);
  
  return {
    loading,
    error,
    data,
    execute,
    clearError,
    clearData,
    reset
  };
};

export default useApi; 