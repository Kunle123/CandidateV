const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors());

// Supabase proxy configuration
const supabaseProxy = createProxyMiddleware({
  target: process.env.SUPABASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/auth/v1': '/auth/v1'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward necessary Supabase headers
    proxyReq.setHeader('apikey', process.env.SUPABASE_ANON_KEY);
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

// Export service proxy
const exportProxy = createProxyMiddleware({
  target: process.env.EXPORT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/export': ''
  }
});

// CV service proxy
const cvProxy = createProxyMiddleware({
  target: process.env.CV_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/cv': ''
  }
});

// AI service proxy
const aiProxy = createProxyMiddleware({
  target: process.env.AI_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/ai': ''
  }
});

// Payment service proxy
const paymentProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/payment': ''
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      supabase: process.env.SUPABASE_URL,
      export: process.env.EXPORT_SERVICE_URL,
      cv: process.env.CV_SERVICE_URL,
      ai: process.env.AI_SERVICE_URL,
      payment: process.env.PAYMENT_SERVICE_URL
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
  console.log(`- Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`- EXPORT Service: ${process.env.EXPORT_SERVICE_URL}`);
  console.log(`- CV Service: ${process.env.CV_SERVICE_URL}`);
  console.log(`- AI Service: ${process.env.AI_SERVICE_URL}`);
  console.log(`- PAYMENT Service: ${process.env.PAYMENT_SERVICE_URL}`);
}); 