import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import App from './App'
import theme from './utils/theme'
import './index.css'

// Add request interceptor for debugging only
import axios from 'axios'

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