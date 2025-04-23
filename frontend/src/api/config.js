/**
 * API Configuration based on environment
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const environment = process.env.NODE_ENV || 'development';

// Base URLs for different environments
const BASE_URLS = {
  development: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  production: import.meta.env.VITE_API_BASE_URL || 'https://api-gw-production.up.railway.app',
  test: 'http://localhost:3000/api'
};

// Timeout settings (milliseconds)
const TIMEOUTS = {
  development: 30000, // 30 seconds
  production: 45000,  // 45 seconds
  test: 10000         // 10 seconds
};

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001';
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:3002';

// Config export
const config = {
  baseURL: BASE_URLS[environment],
  timeout: TIMEOUTS[environment],
  environment,
  isDevelopment,
  isProduction,
  
  // Logging settings
  logging: {
    enabled: true,
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
  },

  // Feature flags
  features: {
    autoRefreshToken: true,
    requestInterceptors: true,
    responseInterceptors: true,
    errorHandling: true
  },

  // Service endpoints (for special cases)
  endpoints: {
    auth: {
      signUp: '/auth/signup',
      signIn: '/auth/signin',
      signOut: '/auth/signout',
      refresh: '/auth/refresh',
      resetPassword: '/auth/reset-password',
      verifyEmail: '/auth/verify-email'
    },
    user: {
      profile: '/users/me',
      preferences: '/users/preferences'
    },
    cv: {
      templates: '/cv/templates',
      list: '/cv',
      create: '/cv',
      update: '/cv/:id',
      delete: '/cv/:id'
    },
    export: {
      formats: '/export/formats',
      generate: '/export/generate',
      download: '/export/download/:id'
    },
    ai: {
      analyze: '/ai/analyze',
      optimize: '/ai/optimize',
      coverLetter: '/ai/cover-letter'
    },
    payment: {
      plans: '/payment/plans',
      subscribe: '/payment/subscribe',
      cancel: '/payment/cancel'
    }
  },

  AUTH_API_URL,
  USER_API_URL
};

export default config; 