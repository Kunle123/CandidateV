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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      supabase: process.env.SUPABASE_URL
    }
  });
});

// Route handlers
app.use('/auth/v1', supabaseProxy);

// Handle OPTIONS requests
app.options('*', cors());

app.listen(port, () => {
  console.log(`Simplified API Gateway running on port ${port}\n`);
  console.log('Configured Services:');
  console.log(`- Supabase: ${process.env.SUPABASE_URL}`);
}); 