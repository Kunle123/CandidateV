require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

// Environment variables with explicit defaults
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'https://candidatev-auth-service.up.railway.app',
  user: process.env.USER_SERVICE_URL || 'https://candidatev-user-service.up.railway.app',
  cv: process.env.CV_SERVICE_URL || 'https://candidatev-cv-service.up.railway.app',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'https://ai-service-production.up.railway.app',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://candidatev-payment-service.up.railway.app'
};

// CORS configuration
const corsOptions = {
  origin: ['https://candidate-v.vercel.app', 'https://candidate-oyfl01pgt-kunle-ibiduns-projects.vercel.app', 'http://localhost:3000', 'http://localhost:5173', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply essential middleware
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Add CORS headers to all responses
app.use((req, res, next) => {
  // Allow requests from any origin in development
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICE_URLS).map(name => ({
      name,
      url: SERVICE_URLS[name]
    }))
  });
});

// Debug endpoint to see request structure
app.post('/api/debug/echo', (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Request echoed',
      body: req.body,
      headers: req.headers,
      method: req.method,
      path: req.path,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error echoing request',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working correctly',
    requestHeaders: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Force real service connection with a specific header
app.use((req, res, next) => {
  // Check for a special header that forces use of the real service
  if (req.headers['x-use-real-service'] === 'true' || req.query.use_real_service === 'true') {
    const servicePath = req.path.split('/')[2]; // Extract service name from path
    if (servicePath && SERVICE_URLS[servicePath]) {
      console.log(`Forcing use of real service for ${req.method} ${req.originalUrl}`);
      return createProxy(servicePath, SERVICE_URLS[servicePath])(req, res, next);
    }
  }
  next();
});

// Create proxy middleware function
const createProxy = (serviceName, targetUrl) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    timeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging
      console.log(`Proxying ${req.method} request to ${serviceName}: ${req.path}`);
      
      // Add debugging headers
      proxyReq.setHeader('X-Proxy-Service', serviceName);
      proxyReq.setHeader('X-Proxy-Target', targetUrl);
      proxyReq.setHeader('X-Original-URL', req.originalUrl);
    },
    pathRewrite: (path, req) => {
      // For OPTIONS requests, return null to prevent proxying
      if (req.method === 'OPTIONS') {
        return null;
      }
      // Log the path rewrite for debugging
      console.log(`Path rewrite: ${path} -> ${path}`);
      return path;
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}: ${err.message}`, {
        service: serviceName,
        targetUrl,
        originalUrl: req.originalUrl,
        path: req.path,
        method: req.method,
        error: err.message
      });
      
      // For OPTIONS requests, handle directly
      if (req.method === 'OPTIONS') {
        // Allow requests from any origin in development
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          res.header('Access-Control-Allow-Origin', '*');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        res.status(200).end();
        return;
      }
      
      // Set proper CORS headers in error response
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        res.header('Access-Control-Allow-Origin', '*');
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      res.status(503).json({
        status: 'error',
        message: `${serviceName} service temporarily unavailable`,
        error: err.message,
        originalUrl: req.originalUrl,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Set up service routes
app.use('/api/auth', (req, res, next) => {
  // Always proxy auth requests to the auth service
  console.log(`Proxying Auth request to real Auth service: ${req.method} ${req.originalUrl}`);
  return createProxy('auth', SERVICE_URLS.auth)(req, res, next);
});

app.use('/api/users', createProxy('user', SERVICE_URLS.user));

// Proxy requests for /api/cv
app.use('/api/cv', (req, res, next) => {
  // Unconditionally proxy all /api/cv requests to the CV service
  console.log(`Proxying CV request to real CV service: ${req.method} ${req.originalUrl}`);
  return createProxy('cv', SERVICE_URLS.cv)(req, res, next);
});

app.use('/api/export', createProxy('export', SERVICE_URLS.export));

// Modified AI service proxy to prioritize local implementations
app.use('/api/ai', (req, res, next) => {
  // Remove all local mock implementations and always use the real AI service
  console.log(`Forwarding AI service request to real service: ${req.originalUrl}`);
  return createProxy('ai', SERVICE_URLS.ai)(req, res, next);
});

app.use('/api/payments', createProxy('payment', SERVICE_URLS.payment));

// Default 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  
  // Set proper CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_routes: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/cv',
      '/api/cv/:id',
      '/api/ai/job-match/analyze',
      '/api/debug/echo'
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simplified API Gateway running on port ${PORT}`);
  console.log('\nConfigured Services:');
  Object.entries(SERVICE_URLS).forEach(([service, url]) => {
    console.log(`- ${service.toUpperCase()} Service: ${url}`);
  });
});

module.exports = app; 