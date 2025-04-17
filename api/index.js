require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const axios = require('axios');

// Fixed PORT for API Gateway - part of refactor strategy
const PORT = 3000;

// Validate port availability before continuing
function checkPortAvailability(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Please stop any existing services using this port.`));
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve();
    });
    
    server.listen(port);
  });
}

// Check service health - utility for service validation
async function checkServiceHealth(name, url) {
  try {
    const startTime = Date.now();
    // Add a simple check to detect if this is a public URL
    const isPublicUrl = url.includes('.up.railway.app');
    
    console.log(`Checking health for ${name} using ${isPublicUrl ? 'public' : 'internal'} URL: ${url}`);
    
    const response = await axios.get(`${url}/api/health`, { 
      timeout: 10000,
      validateStatus: status => status < 500
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`Health check successful for ${name} using ${url}`);
    
    return {
      available: true,
      status: response.status,
      responseTime,
      message: response.data?.message || 'OK',
      usingPublicUrl: isPublicUrl,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.log(`Health check failed for ${name} using ${url}: ${error.message}`);
    
    return {
      available: false,
      status: error.response?.status || 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Environment variables with more explicit defaults
const SERVICE_URLS = {
  // Use public URLs directly since they're reliable
  auth: process.env.AUTH_SERVICE_URL || 'https://candidatev-auth-service.up.railway.app',
  user: process.env.USER_SERVICE_URL || 'https://candidatev-user-service.up.railway.app',
  cv: process.env.CV_SERVICE_URL || 'https://candidatev-cv-service.up.railway.app',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'https://candidatev-ai-service.up.railway.app',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://candidatev-payment-service.up.railway.app'
};

// Log level from environment or default to info
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
// Debug flag for verbose logging - parse string to boolean
const DEBUG = process.env.DEBUG === 'true';

// Configure logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
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

// Add path validation middleware to detect and fix duplicated /api segments
app.use((req, res, next) => {
  if (req.path.includes('/api/api/')) {
    logger.warn(`Duplicate API path detected: ${req.path}`);
    
    // Fix the path by replacing duplicated segments
    const fixedPath = req.path.replace(/\/api\/api\//g, '/api/');
    logger.info(`Redirecting to fixed path: ${fixedPath}`);
    
    // Redirect to the fixed path
    return res.redirect(fixedPath);
  }
  next();
});

// Configure CORS to allow requests from the Vercel domain
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['https://candidate-v.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions)); // Use the configured CORS options
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

// Update the Health Check Interval
const HEALTH_CHECK_INTERVAL = process.env.HEALTH_CHECK_INTERVAL || 60000; // Default 60 seconds (up from 15)

// Periodic health checks for all services
function startHealthChecks() {
  logger.info(`Started health checks with interval: ${HEALTH_CHECK_INTERVAL}ms`);
  
  setInterval(async () => {
    // Check all services in parallel
    const checks = Object.entries(SERVICE_URLS).map(async ([service, url]) => {
      try {
        const health = await checkServiceHealth(service, url);
        serviceStatus[service] = {
          ...health,
          lastChecked: new Date()
        };
        
        if (!health.available) {
          logger.warn(`Service ${service} health check failed: ${health.error || 'Unknown error'}`);
        }
      } catch (error) {
        logger.error(`Failed to check health of ${service}: ${error.message}`);
      }
    });
    
    try {
      await Promise.all(checks);
    } catch (error) {
      logger.error(`Health check batch failed: ${error.message}`);
    }
  }, HEALTH_CHECK_INTERVAL);
}

// Service status endpoint for monitoring
app.get('/api/gateway-status', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: serviceStatus,
    serviceUrls: SERVICE_URLS,
    timestamp: new Date().toISOString()
  });
});

// Detailed health check endpoint
app.get('/api/health', async (req, res) => {
  // Perform live health checks if requested
  if (req.query.check === 'true') {
    const checks = await Promise.all(
      Object.entries(SERVICE_URLS).map(async ([name, url]) => {
        return { 
          service: name, 
          ...(await checkServiceHealth(name, url))
        };
      })
    );
    
    const allHealthy = checks.every(check => check.available);
    
    return res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      gateway: {
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString()
      },
      services: checks,
      environment: process.env.NODE_ENV || 'development',
    });
  }
  
  // Simple health status based on cached status
  const allAvailable = Object.values(serviceStatus).every(s => s.available);
  res.status(allAvailable ? 200 : 503).json({
    status: allAvailable ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: serviceStatus
  });
});

// Create a unified proxy creator for all services
const createServiceProxy = (serviceName, targetUrl) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      // Add request ID to all proxied requests
      proxyReq.setHeader('X-Request-ID', req.id);
      
      // Forward auth header if present
      if (req.headers.authorization) {
        if (DEBUG) console.log(`Token forwarded to ${serviceName}: ${req.path}`);
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      
      if (DEBUG) console.log(`${serviceName.toUpperCase()} REQUEST: ${req.method} ${req.originalUrl} -> ${targetUrl}${req.path}`);
      
      // Update service status
      serviceStatus[serviceName].available = true;
      serviceStatus[serviceName].lastChecked = new Date();
    },
    onProxyRes: (proxyRes, req, res) => {
      if (DEBUG) console.log(`${serviceName.toUpperCase()} RESPONSE: ${proxyRes.statusCode} for ${req.originalUrl}`);
      
      if (proxyRes.statusCode < 500) {
        serviceStatus[serviceName].available = true;
      } else {
        serviceStatus[serviceName].available = false;
        serviceStatus[serviceName].lastError = `HTTP ${proxyRes.statusCode}`;
        logger.error(`${serviceName} service error: ${proxyRes.statusCode} for ${req.originalUrl}`);
      }
    },
    onError: (err, req, res) => {
      const errorMessage = `${serviceName.toUpperCase()} ERROR: ${err.message} for ${req.originalUrl}`;
      console.error(errorMessage);
      
      serviceStatus[serviceName].available = false;
      serviceStatus[serviceName].lastError = err.message;
      logger.error(`${serviceName} service unavailable: ${err.message} for ${req.originalUrl}`);
      
      // Special handling for auth service
      if (serviceName === 'auth' && req.path.includes('/register')) {
        // For registration, return a special message
        return res.status(503).json({
          status: 'error',
          message: 'Authentication service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          requestId: req.id,
          error: 'Please try again later or contact support',
          timestamp: new Date().toISOString()
        });
      }
      
      // Provide a more helpful error message to the client
      const errorResponse = {
        status: 'error',
        message: `${serviceName} service temporarily unavailable`,
        error: err.message,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        suggestions: [
          'The service may still be starting up - try again in a moment',
          'Check if the service is running with correct port configuration',
          'Verify network connectivity between services'
        ]
      };
      
      // For critical auth failures, provide more guidance
      if (serviceName === 'auth') {
        errorResponse.suggestions.unshift('Try logging out and back in to refresh your session');
      }
      
      res.status(503).json(errorResponse);
    }
  });
};

// Route all services using a consistent approach
app.use('/api/auth', createServiceProxy('auth', SERVICE_URLS.auth));
app.use('/api/users', createServiceProxy('user', SERVICE_URLS.user));
app.use('/api/cv', createServiceProxy('cv', SERVICE_URLS.cv));
app.use('/api/export', createServiceProxy('export', SERVICE_URLS.export));
app.use('/api/ai', createServiceProxy('ai', SERVICE_URLS.ai));
app.use('/api/payments', createServiceProxy('payment', SERVICE_URLS.payment));

// Default 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    requestId: req.id,
    suggestions: [
      'Check the URL path for typos',
      'Verify that the service endpoint exists',
      'Ensure the path starts with /api/ followed by the service name'
    ]
  });
});

// Async startup function to validate port first
async function startServer() {
  try {
    // Check if port is available
    await checkPortAvailability(PORT);
    
    // Initial health check to log service status
    logger.info('Performing initial service health checks...');
    await Promise.all(
      Object.entries(SERVICE_URLS).map(async ([service, url]) => {
        try {
          const health = await checkServiceHealth(service, url);
          serviceStatus[service] = {
            ...health,
            lastChecked: new Date()
          };
          
          if (health.available) {
            logger.info(`Service ${service} is available at ${url} (${health.responseTime}ms)`);
          } else {
            logger.warn(`Service ${service} at ${url} is not responding: ${health.error || 'Unknown error'}`);
          }
        } catch (error) {
          logger.error(`Failed to check health of ${service}: ${error.message}`);
          serviceStatus[service].available = false;
          serviceStatus[service].lastError = error.message;
        }
      })
    );
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`API Gateway listening on port ${PORT}`);
      console.log(`API Gateway running on http://localhost:${PORT}`);
      
      // Log all service URLs
      console.log('\nConfigured Services:');
      Object.entries(SERVICE_URLS).forEach(([service, url]) => {
        const status = serviceStatus[service].available 
          ? 'AVAILABLE' 
          : 'NOT RESPONDING';
        console.log(`- ${service.toUpperCase()} Service: ${url} (${status})`);
      });
      
      // Start health check monitoring
      startHealthChecks();
    });
  } catch (error) {
    logger.error(`Failed to start API Gateway: ${error.message}`);
    console.error(`\nERROR: ${error.message}`);
    console.error(`The API Gateway must run on port ${PORT} to work correctly with the frontend.\n`);
    process.exit(1);
  }
}

// Start the server
startServer();

// Export for module usage
module.exports = app; 