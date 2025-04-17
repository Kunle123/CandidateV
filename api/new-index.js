require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Environment variables
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8000';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const CV_SERVICE_URL = process.env.CV_SERVICE_URL || 'http://localhost:8002';
const EXPORT_SERVICE_URL = process.env.EXPORT_SERVICE_URL || 'http://localhost:8003';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8004';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8005';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Initialize Express app
const app = express();

// Add request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Service status tracking
const serviceStatus = {
  auth: { available: false, lastChecked: null },
  user: { available: false, lastChecked: null },
  cv: { available: false, lastChecked: null },
  export: { available: false, lastChecked: null },
  ai: { available: false, lastChecked: null },
  payment: { available: false, lastChecked: null }
};

// Add direct routes for auth debugging
app.get('/api/gateway-status', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: serviceStatus,
    auth_url: AUTH_SERVICE_URL,
    timestamp: new Date().toISOString()
  });
});

// Auth service configuration with detailed logging
const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => {
    // Don't rewrite the path - this was causing the 404 issues
    console.log(`Auth path rewrite: ${path} -> ${path}`);
    return path;
  },
  onProxyReq: (proxyReq, req) => {
    // Add request ID
    proxyReq.setHeader('X-Request-ID', req.id);
    
    // Forward auth header
    if (req.headers.authorization) {
      console.log(`Auth token forwarded: ${req.path}`);
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    console.log(`AUTH REQUEST: ${req.method} ${req.originalUrl} -> ${AUTH_SERVICE_URL}${proxyReq.path}`);
    
    // Update service status
    serviceStatus.auth.available = true;
    serviceStatus.auth.lastChecked = new Date();
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`AUTH RESPONSE: ${req.method} ${req.originalUrl} (${proxyRes.statusCode})`);
    
    if (proxyRes.statusCode < 500) {
      serviceStatus.auth.available = true;
    } else {
      serviceStatus.auth.available = false;
      serviceStatus.auth.lastError = `HTTP ${proxyRes.statusCode}`;
      logger.error(`Auth service error: ${proxyRes.statusCode} for ${req.originalUrl}`);
    }
  },
  onError: (err, req, res) => {
    console.error(`AUTH ERROR: ${err.message} for ${req.originalUrl}`);
    
    serviceStatus.auth.available = false;
    serviceStatus.auth.lastError = err.message;
    
    res.status(503).json({
      status: 'error',
      message: 'Auth service temporarily unavailable',
      error: err.message
    });
  }
});

// General proxy creator for other services
const createServiceProxy = (serviceName, targetUrl) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Request-ID', req.id);
      
      if (req.headers.authorization) {
        console.log(`Token forwarded to ${serviceName}: ${req.path}`);
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      
      console.log(`${serviceName.toUpperCase()} REQUEST: ${req.method} ${req.originalUrl}`);
      
      serviceStatus[serviceName].available = true;
      serviceStatus[serviceName].lastChecked = new Date();
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`${serviceName.toUpperCase()} RESPONSE: ${proxyRes.statusCode} for ${req.originalUrl}`);
      
      if (proxyRes.statusCode < 500) {
        serviceStatus[serviceName].available = true;
      } else {
        serviceStatus[serviceName].available = false;
        serviceStatus[serviceName].lastError = `HTTP ${proxyRes.statusCode}`;
      }
    },
    onError: (err, req, res) => {
      console.error(`${serviceName.toUpperCase()} ERROR: ${err.message} for ${req.originalUrl}`);
      
      serviceStatus[serviceName].available = false;
      serviceStatus[serviceName].lastError = err.message;
      
      res.status(503).json({
        status: 'error',
        message: `${serviceName} service temporarily unavailable`,
        error: err.message
      });
    }
  });
};

// Route services - don't use path rewrites
app.use('/api/auth', authProxy);
app.use('/api/users', createServiceProxy('user', USER_SERVICE_URL));
app.use('/api/cv', createServiceProxy('cv', CV_SERVICE_URL));
app.use('/api/export', createServiceProxy('export', EXPORT_SERVICE_URL));
app.use('/api/ai', createServiceProxy('ai', AI_SERVICE_URL));
app.use('/api/payments', createServiceProxy('payment', PAYMENT_SERVICE_URL));

// Default 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
  console.log(`API Gateway running on http://localhost:${PORT}`);
});

// Export for module usage
module.exports = app; 