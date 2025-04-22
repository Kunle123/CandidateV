const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors());

// Helper function to create proxy middleware with fallback
const createServiceProxy = (serviceName, envUrl, pathPrefix, options = {}) => {
  if (!envUrl) {
    console.warn(`Warning: ${serviceName} URL not configured`);
    return (req, res) => res.status(503).json({ 
      error: `${serviceName} not configured`,
      message: 'Service temporarily unavailable'
    });
  }
  
  const config = {
    ...options,  // spread options first
    target: envUrl,  // then override with required values
    changeOrigin: true
  };

  if (pathPrefix) {
    config.pathRewrite = {
      [`^${pathPrefix}`]: ''
    };
  }

  return createProxyMiddleware(config);
};

// Supabase proxy configuration
const supabaseProxy = createServiceProxy('Supabase', process.env.SUPABASE_URL, '/auth/v1', {
  onProxyReq: (proxyReq, req, res) => {
    // Forward necessary Supabase headers
    if (process.env.SUPABASE_ANON_KEY) {
      proxyReq.setHeader('apikey', process.env.SUPABASE_ANON_KEY);
    }
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Handle CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
  }
});

// Service proxies
const exportProxy = createServiceProxy('Export Service', process.env.EXPORT_SERVICE_URL, '/api/export');
const cvProxy = createServiceProxy('CV Service', process.env.CV_SERVICE_URL, '/api/cv');
const aiProxy = createServiceProxy('AI Service', process.env.AI_SERVICE_URL, '/api/ai');
const paymentProxy = createServiceProxy('Payment Service', process.env.PAYMENT_SERVICE_URL, '/api/payment');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      supabase: process.env.SUPABASE_URL || 'not configured',
      export: process.env.EXPORT_SERVICE_URL || 'not configured',
      cv: process.env.CV_SERVICE_URL || 'not configured',
      ai: process.env.AI_SERVICE_URL || 'not configured',
      payment: process.env.PAYMENT_SERVICE_URL || 'not configured'
    }
  });
});

// Route handlers
app.use('/auth/v1', supabaseProxy);
app.use('/api/export', exportProxy);
app.use('/api/cv', cvProxy);
app.use('/api/ai', aiProxy);
app.use('/api/payment', paymentProxy);

// Handle OPTIONS requests
app.options('*', cors());

app.listen(port, () => {
  console.log(`Simplified API Gateway running on port ${port}\n`);
  console.log('Configured Services:');
  console.log(`- Supabase: ${process.env.SUPABASE_URL || 'not configured'}`);
  console.log(`- Export Service: ${process.env.EXPORT_SERVICE_URL || 'not configured'}`);
  console.log(`- CV Service: ${process.env.CV_SERVICE_URL || 'not configured'}`);
  console.log(`- AI Service: ${process.env.AI_SERVICE_URL || 'not configured'}`);
  console.log(`- Payment Service: ${process.env.PAYMENT_SERVICE_URL || 'not configured'}`);
}); 