const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body
  });
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

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
  console.log(`API Gateway listening on port ${port}`);
}); 