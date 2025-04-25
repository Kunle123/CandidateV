const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Get environment variables
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

// Configure CORS with specific options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('Blocked request from unauthorized origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'apikey',
    'x-client-info',
    'x-my-custom-header',
    'x-supabase-api-version'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Enable CORS with options
app.use(cors(corsOptions));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: {
      nodeVersion: process.version,
      allowedOrigins
    }
  });
});

// Handle preflight requests
app.options('*', cors(corsOptions));

// Proxy /api/auth/* to the auth service
const authServiceUrl = process.env.AUTH_SERVICE_URL;
if (!authServiceUrl) {
  console.error('AUTH_SERVICE_URL environment variable is not set!');
} else {
  app.use('/api/auth', createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
    onProxyReq: (proxyReq, req, res) => {
      // Optionally log or modify proxy requests here
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(502).json({ error: 'Proxy error', details: err.message });
    }
  }));
}

// Proxy /api/cv/* to the CV service
const cvServiceUrl = process.env.CV_SERVICE_URL;
if (!cvServiceUrl) {
  console.error('CV_SERVICE_URL environment variable is not set!');
} else {
  app.use('/api/cv', createProxyMiddleware({
    target: cvServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/cv': '/cv' },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(502).json({ error: 'Proxy error', details: err.message });
    }
  }));
}

// Only apply express.json() to non-proxied routes
app.use(express.json());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`, {
    environment: {
      nodeVersion: process.version,
      allowedOrigins
    }
  });
}); 