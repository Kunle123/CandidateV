const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
  throw new Error('Missing required environment variables');
}

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
app.use(express.json());

// Initialize Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      allowedOrigins
    }
  });
});

// Handle preflight requests
app.options('*', cors(corsOptions));

// Helper function to forward requests to Supabase
async function forwardToSupabase(req, res, type = 'auth') {
  try {
    const baseUrl = type === 'auth' ? '/auth/v1' : '/rest/v1';
    const supabaseEndpoint = `${supabaseUrl}${baseUrl}${req.path.replace(baseUrl, '')}`;
    
    console.log(`Proxying ${type} request to:`, {
      url: supabaseEndpoint,
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        apikey: '[REDACTED]'
      }
    });

    // Special handling for token endpoint
    const isTokenEndpoint = req.path.includes('/token') || req.path.includes('/sign-in');
    const body = isTokenEndpoint ? {
      ...req.body,
      grant_type: 'password'
    } : req.body;

    // Forward the request to Supabase
    const response = await fetch(supabaseEndpoint + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''), {
      method: req.method,
      headers: {
        ...req.headers,
        'apikey': supabaseAnonKey,
        'Authorization': req.headers.authorization || `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    console.log(`Supabase ${type} response:`, {
      url: supabaseEndpoint,
      status: response.status,
      success: response.status < 400,
      error: response.status >= 400 ? data : undefined
    });

    // Set CORS headers
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-my-custom-header'
    });

    // Forward Supabase response
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`${type} proxy error:`, {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    
    // Determine if it's a network error
    const isNetworkError = !error.response && error.message.includes('network');
    
    res.status(isNetworkError ? 502 : 500).json({
      error: isNetworkError ? 'Bad Gateway' : 'Internal Server Error',
      message: error.message,
      code: error.code
    });
  }
}

// Proxy auth requests to Supabase
app.all('/auth/v1/*', (req, res) => forwardToSupabase(req, res, 'auth'));

// Proxy REST requests to Supabase
app.all('/rest/v1/*', (req, res) => forwardToSupabase(req, res, 'rest'));

// Error handling middleware
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  let status = err.status || 500;
  let errorType = 'Internal Server Error';

  if (err.message === 'Not allowed by CORS') {
    status = 403;
    errorType = 'Forbidden';
  }

  // Log error with context
  console.error('Error Handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Build error response
  const errorResponse = {
    error: errorType,
    message: err.message,
    status,
    ...(isProd ? {} : { stack: err.stack, details: err })
  };

  res.status(status).json(errorResponse);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`, {
    environment: {
      nodeVersion: process.version,
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      allowedOrigins
    }
  });
}); 