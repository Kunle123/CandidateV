/**
 * API Configuration based on environment
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const environment = isProduction ? 'production' : 'development';

// Base URLs for different environments
const BASE_URLS = {
  development: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  production: 'https://api-gw-production.up.railway.app/api',
  test: 'http://localhost:3000/api'
};

// Timeout settings (milliseconds)
const TIMEOUTS = {
  development: 30000, // 30 seconds
  production: 45000,  // 45 seconds
  test: 10000         // 10 seconds
};

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
      login: '/auth/login',
      register: '/auth/register',
      refreshToken: '/auth/refresh',
      logout: '/auth/logout'
    },
    user: {
      profile: '/users/me',
      preferences: '/users/me/preferences'
    },
    cv: {
      templates: '/cv/templates',
      cvs: '/cv'
    },
    export: {
      formats: '/export/formats',
      jobs: '/export'
    },
    ai: {
      analyze: '/ai/analyze',
      improve: '/ai/improve',
      generate: '/ai/generate'
    },
    payment: {
      plans: '/payments/plans',
      subscription: '/payments/subscription'
    }
  }
};

export default config; 