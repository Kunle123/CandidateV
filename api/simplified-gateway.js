const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

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
    changeOrigin: true,
    secure: true,
    xfwd: true,
    ws: true
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
  timeout: 30000, // 30 seconds timeout
  proxyTimeout: 31000, // slightly longer than timeout
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to Supabase:', {
      method: req.method,
      path: req.path,
      target: process.env.SUPABASE_URL,
      headers: req.headers
    });
    // Forward necessary Supabase headers
    if (process.env.SUPABASE_ANON_KEY) {
      proxyReq.setHeader('apikey', process.env.SUPABASE_ANON_KEY);
      console.log('Added Supabase API key to request');
    }
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received response from Supabase:', {
      statusCode: proxyRes.statusCode,
      headers: proxyRes.headers
    });
    // Handle CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', {
      error: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      code: err.code
    });
  }
});

// Service proxies
const cvProxy = createServiceProxy('CV Service', process.env.CV_SERVICE_URL, '/api/cv');
const aiProxy = createServiceProxy('AI Service', process.env.AI_SERVICE_URL, '/api/ai');
const paymentProxy = createServiceProxy('Payment Service', process.env.PAYMENT_SERVICE_URL, '/api/payment');

// Export functionality
app.post('/api/export', async (req, res) => {
  try {
    const { format, data } = req.body;
    
    if (!format || !data) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both format and data are required'
      });
    }

    // Handle different export formats
    switch (format.toLowerCase()) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=export.json');
        return res.json(data);
      
      case 'csv':
        if (!Array.isArray(data)) {
          return res.status(400).json({
            error: 'Invalid data format',
            message: 'Data must be an array for CSV export'
          });
        }
        
        const csvContent = data.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
          ).join(',')
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
        return res.send(csvContent);
      
      default:
        return res.status(400).json({
          error: 'Unsupported format',
          message: 'Supported formats are: json, csv'
        });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: 'Failed to process export request'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      supabase: process.env.SUPABASE_URL || 'not configured',
      export: 'memory-resident',
      cv: process.env.CV_SERVICE_URL || 'not configured',
      ai: process.env.AI_SERVICE_URL || 'not configured',
      payment: process.env.PAYMENT_SERVICE_URL || 'not configured'
    }
  });
});

// Route handlers
app.use('/auth/v1', supabaseProxy);
app.use('/api/cv', cvProxy);
app.use('/api/ai', aiProxy);
app.use('/api/payment', paymentProxy);

// Handle OPTIONS requests
app.options('*', cors());

app.listen(port, () => {
  console.log(`Simplified API Gateway running on port ${port}\n`);
  console.log('Configured Services:');
  console.log(`- Supabase: ${process.env.SUPABASE_URL || 'not configured'}`);
  console.log(`- Export Service: memory-resident`);
  console.log(`- CV Service: ${process.env.CV_SERVICE_URL || 'not configured'}`);
  console.log(`- AI Service: ${process.env.AI_SERVICE_URL || 'not configured'}`);
  console.log(`- Payment Service: ${process.env.PAYMENT_SERVICE_URL || 'not configured'}`);
}); 