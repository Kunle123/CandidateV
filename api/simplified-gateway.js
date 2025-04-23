require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing environment variables:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
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
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info', 'x-my-custom-header'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Enable CORS with options
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      hasServiceKey: !!supabaseServiceKey,
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
    
    // For auth endpoints, ensure body parameters take precedence over query parameters
    let requestBody = req.body;
    if (type === 'auth' && req.method === 'POST') {
      requestBody = {
        ...req.query,  // Include query params as fallback
        ...req.body,   // Body params take precedence
      };
    }

    console.log(`Proxying ${type} request to:`, {
      url: supabaseEndpoint,
      method: req.method,
      path: req.path,
      body: requestBody,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        apikey: '[REDACTED]'
      }
    });

    // Forward the request to Supabase
    const response = await fetch(supabaseEndpoint, {
      method: req.method,
      headers: {
        ...req.headers,
        'apikey': supabaseAnonKey,
        'Authorization': req.headers.authorization || `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'  // Ensure JSON content type
      },
      body: req.method !== 'GET' ? JSON.stringify(requestBody) : undefined
    });

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`Supabase ${type} response:`, {
      url: supabaseEndpoint,
      status: response.status,
      success: response.status < 400,
      error: response.status >= 400 ? data : undefined
    });

    // Forward all response headers from Supabase
    response.headers.forEach((value, key) => {
      res.set(key, value);
    });

    // Set CORS headers
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-my-custom-header'
    });

    // Forward Supabase response with original status and data
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
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
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed by CORS policy',
      origin: req.headers.origin
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`, {
    environment: {
      nodeVersion: process.version,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      allowedOrigins
    }
  });
}); 