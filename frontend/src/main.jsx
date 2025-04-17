import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import App from './App'
import theme from './utils/theme'
import './index.css'

// Add request interceptor for debugging only
import axios from 'axios'

// Ensure we have the API_BASE_URL set correctly for all axios requests
if (!axios.defaults.baseURL) {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-gw-production.up.railway.app';
  console.log('🔧 Setting axios default baseURL to:', API_URL);
  axios.defaults.baseURL = API_URL;
}

// Add request validation to catch potential URL issues
axios.interceptors.request.use(
  (config) => {
    // Check for duplicate API paths that might indicate configuration issues
    const url = config.url || '';
    if (url.includes('/api/api/')) {
      console.error('⚠️ DUPLICATE API PATH DETECTED:', url);
      console.error('This indicates a configuration issue with baseURL settings.');
      // Fix the URL by removing the duplicate /api/ segment
      config.url = url.replace('/api/api/', '/api/');
    }
    
    // Ensure all direct axios calls go to the API Gateway
    if (config.url && config.url.startsWith('/api/') && !config.baseURL) {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-gw-production.up.railway.app';
      console.log(`⚠️ Direct axios call without baseURL: ${config.url}`);
      console.log(`🔧 Adding baseURL: ${API_URL}`);
      config.baseURL = API_URL;
    }
    
    // Specific fix for job-match/analyze endpoint
    if (config.url && config.url.includes('/api/ai/job-match/analyze')) {
      console.log('🔧 Fixing job-match/analyze request:', config);
      // Ensure it goes to the API Gateway
      if (!config.baseURL) {
        config.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api-gw-production.up.railway.app';
      }
    }
    
    // Log all requests for debugging
    console.log(`🌐 Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
) 