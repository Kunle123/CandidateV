const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Required Supabase environment variables are missing');
  process.exit(1);
}

// Service URLs - removed auth and user services since we're using Supabase directly
const services = {
  cv: process.env.CV_SERVICE_URL || 'https://candidatev-cv-service.up.railway.app',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'https://candidatev-ai-service.up.railway.app',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://candidatev-payment-service.up.railway.app'
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const supabaseHealth = await axios.get(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    // Check services health
    const serviceChecks = await Promise.allSettled(
      Object.entries(services).map(async ([name, url]) => {
        try {
          await axios.get(`${url}/health`, { timeout: 5000 });
          return { name, url, status: 'healthy' };
        } catch (error) {
          return { name, url, status: 'error', error: error.message };
        }
      })
    );

    const serviceStatus = serviceChecks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        name: result.reason.name,
        url: result.reason.url,
        status: 'error',
        error: result.reason.message
      }
    );
    
    serviceStatus.push({
      name: 'supabase',
      url: SUPABASE_URL,
      status: supabaseHealth.status === 200 ? 'healthy' : 'error'
    });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: serviceStatus
    });
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error checking service health',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to create proxy with proper error handling
function createServiceProxy(target, pathRewrite = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onProxyReq: (proxyReq, req, res) => {
      // Log the request
      console.log(`[${req.method}] ${req.path} -> ${target}`);

      // Add required Supabase headers for Supabase routes
      if (target === SUPABASE_URL) {
        proxyReq.setHeader('apikey', 
          req.path.startsWith('/auth/v1') ? SUPABASE_ANON_KEY : SUPABASE_SERVICE_ROLE_KEY
        );
      }
      
      // Forward authorization header if present
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }

      // Set content type for JSON requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        proxyReq.setHeader('Content-Type', 'application/json');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log the response
      console.log(`[${req.method}] ${req.path} -> ${proxyRes.statusCode}`);

      // Add CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
    },
    onError: (err, req, res) => {
      console.error(`Proxy Error for ${req.path}:`, err);
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: err.message
      });
    }
  });
}

// Configure Supabase routes
app.use('/api/auth', createServiceProxy(SUPABASE_URL + '/auth/v1', {
  '^/api/auth': ''  // Remove the /api/auth prefix when forwarding
}));
app.use('/api/rest', createServiceProxy(SUPABASE_URL + '/rest/v1', {
  '^/api/rest': ''  // Remove the /api/rest prefix when forwarding
}));
app.use('/api/storage', createServiceProxy(SUPABASE_URL + '/storage/v1', {
  '^/api/storage': ''  // Remove the /api/storage prefix when forwarding
}));

// Configure service proxies
Object.entries(services).forEach(([service, url]) => {
  const path = `/api/${service}`;
  app.use(path, createServiceProxy(url, {
    [`^${path}`]: ''  // Remove the /api/service prefix when forwarding
  }));
  console.log(`[Proxy] Created: ${path} -> ${url}`);
});

// Configure CORS for preflight requests
app.options('*', cors());

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
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Configured Services:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`- ${name.toUpperCase()} Service: ${url}`);
  });
  console.log(`- SUPABASE Service: ${SUPABASE_URL}`);
});

module.exports = app; 