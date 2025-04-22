const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS configuration
app.use(cors());

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aqmybjkzxfwiizorveco.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Service URLs - using Railway internal URLs when available
const services = {
  cv: process.env.CV_SERVICE_URL || 'http://candidatev.railway.internal:8003',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'http://ai_service.railway.internal:8002',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment_service.railway.internal:8005'
};

// Proxy middleware configuration
const proxyConfig = {
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth/v1': '/auth/v1',
    '^/api/rest/v1': '/rest/v1'
  },
  onProxyReq: (proxyReq, req, res) => {
    if (SUPABASE_KEY) {
      proxyReq.setHeader('apikey', SUPABASE_KEY);
      proxyReq.setHeader('Authorization', `Bearer ${SUPABASE_KEY}`);
    }
    proxyReq.setHeader('Content-Type', 'application/json');
  }
};

// Supabase auth routes
app.use('/api/auth/v1', createProxyMiddleware({
  ...proxyConfig,
  target: SUPABASE_URL
}));

// Supabase data routes
app.use('/api/rest/v1', createProxyMiddleware({
  ...proxyConfig,
  target: SUPABASE_URL
}));

// Other service routes
Object.entries(services).forEach(([service, url]) => {
  app.use(`/api/${service}`, createProxyMiddleware({
    target: url,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${service}`]: ''
    }
  }));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      ...services,
      supabase: SUPABASE_URL
    }
  });
});

app.listen(PORT, () => {
  console.log(`Simplified API Gateway running on port ${PORT}`);
  console.log('Configured Services:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`- ${name.toUpperCase()} Service: ${url}`);
  });
  console.log(`- SUPABASE Service: ${SUPABASE_URL}`);
}); 