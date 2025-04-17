import axios from 'axios';
import config from './config';

// Custom logger function
const logRequest = (request) => {
  if (config.logging.enabled) {
    console.log(`🚀 API Request: ${request.method?.toUpperCase()} ${request.url}`);
    
    if (config.logging.level === 'debug') {
      // Log token for debugging
      const token = localStorage.getItem('access_token');
      const hasToken = !!token;
      
      console.log('Request Details:', {
        headers: request.headers,
        params: request.params,
        data: request.data,
        hasAuthToken: hasToken,
        tokenFirstChars: hasToken ? `${token.substring(0, 15)}...` : 'none'
      });
    }
  }
  return request;
};

const logResponse = (response) => {
  if (config.logging.enabled) {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    
    if (config.logging.level === 'debug') {
      console.log('Response Data:', response.data);
    }
  }
  return response;
};

const logError = (error) => {
  if (config.logging.enabled) {
    console.error(`❌ API Error: ${error.response?.status || 'NETWORK ERROR'} ${error.config?.url || 'Unknown URL'}`);
    
    if (config.logging.level === 'debug') {
      console.error('Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      
      // For auth errors, log even more details
      if (error.config?.url?.includes('/auth/')) {
        console.error('Auth Error Details:', {
          originalRequest: error.config,
          responseHeaders: error.response?.headers,
        });
      }

      // Add service unavailable handling with retry suggestions
      if (error.response?.status === 503) {
        console.error('SERVICE UNAVAILABLE: The requested service is not responding.');
        console.error('Possible causes:');
        console.error('1. The service may still be starting up - wait a moment and try again');
        console.error('2. The service may have crashed - check backend logs');
        console.error('3. Port conflicts - ensure all services are on their correct ports');
      }
    }
  }
  return Promise.reject(error);
};

// Create a base URL strategy based on environment
const getBaseUrl = () => {
  // First check for environment variables (highest priority)
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    console.log('🔧 Using API URL from environment:', envApiUrl);
    return envApiUrl;
  }
  
  // Development mode fallback
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    console.log('🔧 Using local development API URL');
    return 'http://localhost:8000';
  }
  
  // Last resort fallback for production
  console.log('🔧 Using default production API URL');
  return 'https://api-gateway-production.up.railway.app';
};

// Get the correct base URL based on environment
const API_BASE_URL = getBaseUrl();
console.log('🔧 API Client using base URL:', API_BASE_URL);
console.log('🔧 API requests should use paths starting with /api/');
// FORCE API BASE URL in apiClient.js
// Removing duplicate declarations that were causing errors
// const API_BASE_URL = 'http://localhost:3000/api';
// console.log('🔧 Using fixed API base URL:', API_BASE_URL);
// FORCE API BASE URL in apiClient.js
// const API_BASE_URL = 'http://localhost:3000/api';
// console.log('🔧 Using fixed API base URL:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: config.timeout || 30000,  // Increase timeout to 30s by default
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
if (config.features.requestInterceptors) {
  apiClient.interceptors.request.use(
    (request) => {
      // Ensure API paths are correctly formatted for Railway API Gateway
      if (request.url && !request.url.startsWith('/api/') && !request.url.startsWith('http')) {
        // Remove any leading slashes to prevent double slashes
        const cleanUrl = request.url.replace(/^\/+/, '');
        console.log(`🔄 Adding /api prefix to request path: ${cleanUrl}`);
        request.url = `/api/${cleanUrl}`;
      }
      
      // Add auth token (ensure it's properly formatted)
      const token = localStorage.getItem('access_token');
      if (token) {
        // Ensure it's using Bearer format
        request.headers.Authorization = `Bearer ${token}`;
        
        // For debugging
        if (config.logging.level === 'debug') {
          console.log('🔑 Using auth token:', token.substring(0, 15) + '...');
        }
      } else if (config.logging.level === 'debug') {
        console.log('⚠️ No auth token found in localStorage');
      }
      
      // Log request
      return logRequest(request);
    },
    (error) => {
      logError(error);
      return Promise.reject(error);
    }
  );
}

// Response interceptor for handling common errors
if (config.features.responseInterceptors) {
  apiClient.interceptors.response.use(
    (response) => logResponse(response),
    async (error) => {
      logError(error);
      
      const originalRequest = error.config;
      
      // Handle 401 Unauthorized errors (token expired)
      if (config.features.autoRefreshToken && 
          error.response?.status === 401 && 
          !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refresh_token = localStorage.getItem('refresh_token');
          if (!refresh_token) {
            // No refresh token available, redirect to login
            console.log('No refresh token available, redirecting to login');
            window.location.href = '/login';
            return Promise.reject(error);
          }
          
          // Call the refresh endpoint directly (not using this interceptor to avoid loops)
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`, 
            { refresh_token }
          );
          
          if (response.data && response.data.access_token) {
            const { access_token } = response.data;
            
            // Update the token in localStorage
            localStorage.setItem('access_token', access_token);
            
            // Update the Authorization header and retry the original request
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return axios(originalRequest);
          } else {
            console.error('Invalid refresh token response:', response.data);
            throw new Error('Invalid refresh token response');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      // Handle 503 Service Unavailable with retry logic
      if (error.response?.status === 503 && !originalRequest._serviceRetry) {
        // Only attempt one automatic retry for service unavailability
        originalRequest._serviceRetry = true;
        
        console.log(`⚠️ Service unavailable for ${originalRequest.url} - attempting retry in 2 seconds...`);
        
        // Wait 2 seconds and retry
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(axios(originalRequest));
          }, 2000);
        });
      }
      
      // Handle other errors
      return Promise.reject(error);
    }
  );
}

// Export API service functions for common operations
export const apiService = {
  // Wrapper for GET requests
  get: (path, config = {}) => {
    // Ensure path has no leading slash but doesn't already have /api/
    const cleanPath = path.replace(/^\/+/, '');
    const fixedPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;
    return apiClient.get(fixedPath, config);
  },
  
  // Wrapper for POST requests
  post: (path, data = {}, config = {}) => {
    const cleanPath = path.replace(/^\/+/, '');
    const fixedPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;
    return apiClient.post(fixedPath, data, config);
  },
  
  // Wrapper for PUT requests
  put: (path, data = {}, config = {}) => {
    const cleanPath = path.replace(/^\/+/, '');
    const fixedPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;
    return apiClient.put(fixedPath, data, config);
  },
  
  // Wrapper for DELETE requests
  delete: (path, config = {}) => {
    const cleanPath = path.replace(/^\/+/, '');
    const fixedPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;
    return apiClient.delete(fixedPath, config);
  }
};

export default apiClient;
