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

// Proxy auth requests to Supabase
app.all('/auth/v1/*', async (req, res) => {
  try {
    const supabaseAuthUrl = `${supabaseUrl}/auth/v1${req.path.replace('/auth/v1', '')}`;
    console.log('Proxying auth request to:', supabaseAuthUrl);

    // Forward the request to Supabase
    const response = await fetch(supabaseAuthUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        'apikey': supabaseAnonKey,
        'Authorization': req.headers.authorization || `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    console.log('Supabase auth response:', {
      status: response.status,
      data
    });

    // Set CORS headers explicitly for auth responses
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-my-custom-header'
    });

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Auth proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Proxy REST requests to Supabase
app.all('/rest/v1/*', async (req, res) => {
  try {
    const supabaseRestUrl = `${supabaseUrl}/rest/v1${req.path.replace('/rest/v1', '')}`;
    console.log('Proxying REST request to:', supabaseRestUrl);

    const response = await fetch(supabaseRestUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        'apikey': supabaseAnonKey,
        'Authorization': req.headers.authorization || `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    console.log('Supabase REST response:', {
      status: response.status,
      data
    });

    // Set CORS headers explicitly for REST responses
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-my-custom-header'
    });

    res.status(response.status).json(data);
  } catch (error) {
    console.error('REST proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
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