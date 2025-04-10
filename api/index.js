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

// For Vercel deployment
const isVercel = process.env.VERCEL === '1';

// Configure logger
let logger;

if (isVercel) {
  // Simplified logging for Vercel
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
} else {
  // Full logging for other environments
  logger = winston.createLogger({
    level: 'info',
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
}

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

// Use morgan only in non-Vercel environments
if (!isVercel) {
  app.use(morgan('combined'));
}

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      requestId: req.id
    });
  });
  next();
});

// Service status tracking
const serviceStatus = {
  auth: { available: false, lastChecked: null },
  user: { available: false, lastChecked: null },
  cv: { available: false, lastChecked: null },
  export: { available: false, lastChecked: null },
  ai: { available: false, lastChecked: null },
  payment: { available: false, lastChecked: null }
};

// Proxy configuration with error handling
const createServiceProxy = (servicePath, targetUrl, serviceName) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/api${servicePath}`]: '/api',
    },
    onProxyReq: (proxyReq, req) => {
      // Add request ID to the proxied request
      proxyReq.setHeader('X-Request-ID', req.id);
      
      // Update service status on successful proxy request
      serviceStatus[serviceName].available = true;
      serviceStatus[serviceName].lastChecked = new Date();
    },
    onProxyRes: (proxyRes, req, res) => {
      // Track successful responses
      if (proxyRes.statusCode < 500) {
        serviceStatus[serviceName].available = true;
        serviceStatus[serviceName].lastChecked = new Date();
      } else {
        serviceStatus[serviceName].available = false;
        serviceStatus[serviceName].lastChecked = new Date();
        serviceStatus[serviceName].lastError = `HTTP ${proxyRes.statusCode}`;
      }
    },
    onError: (err, req, res) => {
      // Update service status on error
      serviceStatus[serviceName].available = false;
      serviceStatus[serviceName].lastChecked = new Date();
      serviceStatus[serviceName].lastError = err.message;
      
      logger.error({
        message: 'Proxy error',
        error: err.message,
        path: req.path,
        requestId: req.id,
        service: targetUrl,
        serviceName
      });
      
      // Send a more detailed error response
      res.status(503).json({
        status: 'error',
        message: `The ${serviceName} service is temporarily unavailable`,
        requestId: req.id,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Service routes
app.use('/api/auth', createServiceProxy('/auth', AUTH_SERVICE_URL, 'auth'));
app.use('/api/users', createServiceProxy('/users', USER_SERVICE_URL, 'user'));

// Only add services if URLs are provided
if (CV_SERVICE_URL && CV_SERVICE_URL !== 'http://localhost:8002') {
  app.use('/api/cv', createServiceProxy('/cv', CV_SERVICE_URL, 'cv'));
}

if (EXPORT_SERVICE_URL && EXPORT_SERVICE_URL !== 'http://localhost:8003') {
  app.use('/api/export', createServiceProxy('/export', EXPORT_SERVICE_URL, 'export'));
}

if (AI_SERVICE_URL && AI_SERVICE_URL !== 'http://localhost:8004') {
  app.use('/api/ai', createServiceProxy('/ai', AI_SERVICE_URL, 'ai'));
}

if (PAYMENT_SERVICE_URL && PAYMENT_SERVICE_URL !== 'http://localhost:8005') {
  app.use('/api/payments', createServiceProxy('/payments', PAYMENT_SERVICE_URL, 'payment'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Check current status of all services
  const servicesStatus = {
    auth: {
      url: AUTH_SERVICE_URL,
      available: serviceStatus.auth.available,
      lastChecked: serviceStatus.auth.lastChecked
    },
    user: {
      url: USER_SERVICE_URL,
      available: serviceStatus.user.available,
      lastChecked: serviceStatus.user.lastChecked
    }
  };
  
  // Only include configured services
  if (CV_SERVICE_URL && CV_SERVICE_URL !== 'http://localhost:8002') {
    servicesStatus.cv = {
      url: CV_SERVICE_URL,
      available: serviceStatus.cv.available,
      lastChecked: serviceStatus.cv.lastChecked
    };
  }
  
  if (EXPORT_SERVICE_URL && EXPORT_SERVICE_URL !== 'http://localhost:8003') {
    servicesStatus.export = {
      url: EXPORT_SERVICE_URL,
      available: serviceStatus.export.available,
      lastChecked: serviceStatus.export.lastChecked
    };
  }
  
  if (AI_SERVICE_URL && AI_SERVICE_URL !== 'http://localhost:8004') {
    servicesStatus.ai = {
      url: AI_SERVICE_URL,
      available: serviceStatus.ai.available,
      lastChecked: serviceStatus.ai.lastChecked
    };
  }
  
  if (PAYMENT_SERVICE_URL && PAYMENT_SERVICE_URL !== 'http://localhost:8005') {
    servicesStatus.payment = {
      url: PAYMENT_SERVICE_URL,
      available: serviceStatus.payment.available,
      lastChecked: serviceStatus.payment.lastChecked
    };
  }
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: isVercel ? 'vercel' : 'other',
    services: servicesStatus
  });
});

// Debug endpoint for Vercel environment
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    environment: {
      isVercel: isVercel,
      nodeEnv: process.env.NODE_ENV
    },
    serviceUrls: {
      auth: AUTH_SERVICE_URL,
      user: USER_SERVICE_URL,
      cv: CV_SERVICE_URL,
      export: EXPORT_SERVICE_URL,
      ai: AI_SERVICE_URL,
      payment: PAYMENT_SERVICE_URL
    },
    serviceStatus,
    requestId: req.id
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    requestId: req.id
  });
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn({
    message: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    requestId: req.id
  });
  res.status(404).json({
    status: 'error',
    message: 'Not found',
    path: req.originalUrl,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// Start server (only in non-Vercel environments)
if (!isVercel) {
  app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app; 