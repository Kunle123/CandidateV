require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables with explicit defaults
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'https://candidatev-auth-service.up.railway.app',
  user: process.env.USER_SERVICE_URL || 'https://candidatev-user-service.up.railway.app',
  cv: process.env.CV_SERVICE_URL || 'https://candidatev-cv-service.up.railway.app',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'https://candidatev-ai-service.up.railway.app',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://candidatev-payment-service.up.railway.app'
};

// CORS configuration
const corsOptions = {
  origin: ['https://candidate-v.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
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
app.use(morgan('combined'));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://candidate-v.vercel.app');
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

// Mock auth registration endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Received registration request:', req.body);
  
  // Check if required fields are present
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock successful registration
  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    user: {
      id: `user-${Date.now()}`,
      email: req.body.email,
      created_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Mock auth login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Received login request:');
  console.log('Body:', JSON.stringify(req.body));
  console.log('Headers:', JSON.stringify(req.headers));
  
  try {
    // Debug received data
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
        console.log('Parsed string body:', JSON.stringify(req.body));
      } catch (e) {
        console.error('Failed to parse string body:', e);
      }
    }
    
    // For form data or URL encoded
    if (req.body && req.body.data) {
      try {
        const parsedData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
        console.log('Found data field:', JSON.stringify(parsedData));
        
        // Use the parsed data
        if (parsedData.email) req.body.email = parsedData.email;
        if (parsedData.password) req.body.password = parsedData.password;
      } catch (e) {
        console.error('Failed to parse data field:', e);
      }
    }
    
    // Check if required fields are present
    if (!req.body.email || !req.body.password) {
      console.error('Missing required fields. Body:', JSON.stringify(req.body));
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Mock successful login
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token: `mock-jwt-token-${Date.now()}`,
      user: {
        id: `user-${Date.now()}`,
        email: req.body.email,
        created_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in login endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

// Create proxy middleware function
const createProxy = (serviceName, targetUrl) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    timeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging
      console.log(`Proxying ${req.method} request to ${serviceName}: ${req.path}`);
    },
    pathRewrite: (path, req) => {
      // For OPTIONS requests, return null to prevent proxying
      if (req.method === 'OPTIONS') {
        return null;
      }
      return path;
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}: ${err.message}`);
      
      // For OPTIONS requests, handle directly
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', 'https://candidate-v.vercel.app');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        res.status(200).end();
        return;
      }
      
      res.status(503).json({
        status: 'error',
        message: `${serviceName} service temporarily unavailable`,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Set up service routes - Note: These will only be used if a request doesn't match our local routes
app.use('/api/auth', (req, res, next) => {
  // We have local implementations for these auth routes
  if (req.path === '/register' || req.path === '/login') {
    return next('route'); // Skip the proxy for these routes
  }
  return createProxy('auth', SERVICE_URLS.auth)(req, res, next);
});

app.use('/api/users', createProxy('user', SERVICE_URLS.user));
app.use('/api/cv', createProxy('cv', SERVICE_URLS.cv));
app.use('/api/export', createProxy('export', SERVICE_URLS.export));
app.use('/api/ai', createProxy('ai', SERVICE_URLS.ai));
app.use('/api/payments', createProxy('payment', SERVICE_URLS.payment));

// Default 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
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