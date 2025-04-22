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
  cv: process.env.CV_SERVICE_URL || 'https://candidatev-cv-service.up.railway.app',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'https://candidatev-ai-service.up.railway.app',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://candidatev-payment-service.up.railway.app',
  supabase: process.env.SUPABASE_URL || 'https://aqmybjkzxfwiizorveco.supabase.co'
};

// CORS configuration
const corsOptions = {
  origin: ['https://candidate-v.vercel.app', 'https://candidate-v-frontend.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'apikey'],
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
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey');
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
      
      // For Supabase requests, ensure all required headers are forwarded
      if (serviceName === 'supabase') {
        if (req.headers.apikey) {
          proxyReq.setHeader('apikey', req.headers.apikey);
        }
        if (req.headers.authorization) {
          proxyReq.setHeader('authorization', req.headers.authorization);
        }
        proxyReq.setHeader('Content-Type', 'application/json');
      }
    },
    pathRewrite: (path, req) => {
      if (req.method === 'OPTIONS') {
        return null;
      }
      return path;
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}: ${err.message}`);
      
      if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        if (corsOptions.origin.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey');
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

// Set up service routes
// Supabase routes
app.use('/auth/v1', createProxy('supabase', `${SERVICE_URLS.supabase}/auth/v1`));
app.use('/rest/v1', createProxy('supabase', `${SERVICE_URLS.supabase}/rest/v1`));

// Service routes
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