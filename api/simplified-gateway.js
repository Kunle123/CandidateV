const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
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
    ws: true,
    timeout: 30000,
    proxyTimeout: 31000,
    followRedirects: true,
    retries: 3,
    headers: {
      'Connection': 'keep-alive'
    }
  };

  // Only rewrite paths for Supabase, keep original paths for other services
  if (pathPrefix) {
    config.pathRewrite = {
      [`^${pathPrefix}`]: serviceName === 'Supabase' ? '/auth/v1' : ''
    };
  }

  return createProxyMiddleware(config);
};

// Supabase proxy configuration
const supabaseProxy = createServiceProxy('Supabase', process.env.SUPABASE_URL, '/auth/v1', {
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to Supabase:', {
      method: req.method,
      path: req.path,
      query: req.query,
      target: process.env.SUPABASE_URL
    });
    
    // Forward necessary Supabase headers
    if (process.env.SUPABASE_ANON_KEY) {
      proxyReq.setHeader('apikey', process.env.SUPABASE_ANON_KEY);
      // Only set Authorization header if not already present in request
      if (!req.headers.authorization) {
        proxyReq.setHeader('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`);
      }
    }
    
    // Forward client headers
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    if (req.headers['x-client-info']) {
      proxyReq.setHeader('x-client-info', req.headers['x-client-info']);
    }
    
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Accept', 'application/json');

    // Special handling for token endpoint
    if (req.path.endsWith('/token')) {
      console.log('Token request detected:', {
        headers: proxyReq.getHeaders(),
        body: req.body
      });
    }

    // Log request body for debugging
    if (req.body) {
      console.log('Request body:', req.body);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received response from Supabase:', {
      statusCode: proxyRes.statusCode,
      path: req.path,
      headers: proxyRes.headers
    });
    
    // Handle CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey, x-client-info';
    
    // Special handling for token endpoint responses
    if (req.path.endsWith('/token')) {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log('Token response:', {
            statusCode: proxyRes.statusCode,
            response
          });
        } catch (e) {
          console.error('Failed to parse token response:', body);
        }
      });
    }
    
    // Log response body for debugging
    if (proxyRes.statusCode >= 400) {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        try {
          const error = JSON.parse(body);
          console.error('Supabase error response:', {
            statusCode: proxyRes.statusCode,
            path: req.path,
            error,
            headers: proxyRes.headers
          });
        } catch (e) {
          console.error('Failed to parse error response:', body);
        }
      });
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method
    });
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return res.status(502).json({
        error: 'Connection error',
        message: 'Failed to connect to authentication service. Please try again.',
        code: err.code
      });
    }
    
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      code: err.code
    });
  }
});

// CV service proxy configuration
const cvProxy = createServiceProxy('CV Service', process.env.CV_SERVICE_URL, '/api/cv', {
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to CV Service:', {
      method: req.method,
      path: req.path,
      query: req.query,
      target: process.env.CV_SERVICE_URL
    });
    
    // Forward authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received response from CV Service:', {
      statusCode: proxyRes.statusCode,
      path: req.path
    });
    
    // Handle CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  },
  onError: (err, req, res) => {
    console.error('CV Service proxy error:', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method
    });
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return res.status(502).json({
        error: 'Connection error',
        message: 'Failed to connect to CV service. Please try again.',
        code: err.code
      });
    }
    
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      code: err.code
    });
  }
});

// AI service proxy configuration
const aiProxy = createServiceProxy('AI Service', process.env.AI_SERVICE_URL, '/api/ai', {
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to AI Service:', {
      method: req.method,
      path: req.path,
      query: req.query,
      target: process.env.AI_SERVICE_URL
    });
    
    // Forward authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received response from AI Service:', {
      statusCode: proxyRes.statusCode,
      path: req.path
    });
    
    // Handle CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  },
  onError: (err, req, res) => {
    console.error('AI Service proxy error:', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method
    });
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return res.status(502).json({
        error: 'Connection error',
        message: 'Failed to connect to AI service. Please try again.',
        code: err.code
      });
    }
    
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      code: err.code
    });
  }
});

// Payment service proxy configuration
const paymentProxy = createServiceProxy('Payment Service', process.env.PAYMENT_SERVICE_URL, '/api/payment', {
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to Payment Service:', {
      method: req.method,
      path: req.path,
      query: req.query,
      target: process.env.PAYMENT_SERVICE_URL
    });
    
    // Forward authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received response from Payment Service:', {
      statusCode: proxyRes.statusCode,
      path: req.path
    });
    
    // Handle CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  },
  onError: (err, req, res) => {
    console.error('Payment Service proxy error:', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method
    });
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return res.status(502).json({
        error: 'Connection error',
        message: 'Failed to connect to payment service. Please try again.',
        code: err.code
      });
    }
    
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      code: err.code
    });
  }
});

// Route handlers - Note: Order matters!
// Specific auth endpoints first
app.get('/auth/v1/session', async (req, res) => {
  try {
    console.log('Handling session request:', {
      headers: req.headers
    });

    // Extract the JWT token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(200).json({
        data: { session: null },
        error: null
      });
    }

    // Get user data from Supabase
    const response = await axios.get(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    });

    console.log('Session response:', {
      status: response.status
    });

    // Calculate token expiry (1 hour from now)
    const expiresIn = 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Format response to match Supabase session format
    return res.status(200).json({
      data: {
        session: {
          access_token: token,
          token_type: 'bearer',
          expires_in: expiresIn,
          expires_at: expiresAt,
          refresh_token: null,
          user: response.data,
          provider_token: null,
          provider_refresh_token: null
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Session error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      return res.status(200).json({
        data: { session: null },
        error: null
      });
    }

    return res.status(error.response?.status || 500).json({
      error: error.response?.data || {
        message: 'Internal server error during session check'
      }
    });
  }
});

app.post('/auth/v1/signup', async (req, res) => {
  try {
    console.log('Received signup request:', {
      email: req.body.email,
      hasPassword: !!req.body.password,
      data: req.body.data
    });

    // Log environment variables (redacted)
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      supabaseUrlLength: process.env.SUPABASE_URL?.length,
      anonKeyLength: process.env.SUPABASE_ANON_KEY?.length
    });

    const headers = {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    };

    console.log('Request headers:', {
      contentType: headers['Content-Type'],
      hasApiKey: !!headers.apikey,
      hasAuthorization: !!headers.Authorization,
      apiKeyLength: headers.apikey?.length
    });

    const response = await axios.post(
      `${process.env.SUPABASE_URL}/auth/v1/signup`,
      {
        ...req.body,
        email_confirm: true,
        gotrue_meta_security: {
          captcha_token: req.body.captcha_token
        }
      },
      { headers }
    );

    console.log('Supabase signup response:', {
      status: response.status,
      data: response.data
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Signup error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      error: 'Internal server error during signup',
      message: error.message
    });
  }
});

app.post('/auth/v1/token', async (req, res) => {
  try {
    console.log('Handling token request:', {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'x-client-info': req.headers['x-client-info']
      }
    });

    // Forward the request to Supabase
    const response = await axios.post(
      `${process.env.SUPABASE_URL}/auth/v1/token`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        params: {
          // Forward any query parameters
          ...req.query,
          // Ensure grant_type is set for password-based auth
          grant_type: req.query.grant_type || 'password'
        }
      }
    );

    console.log('Token response:', {
      status: response.status,
      hasData: !!response.data
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Token error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      error: 'Internal server error during token request',
      message: error.message
    });
  }
});

app.post('/auth/v1/sign-in', async (req, res) => {
  try {
    console.log('Handling sign-in request:', {
      method: req.method,
      path: req.path,
      headers: {
        'content-type': req.headers['content-type'],
        'x-client-info': req.headers['x-client-info']
      }
    });

    const response = await axios.post(
      `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    console.log('Sign-in response:', {
      status: response.status,
      hasData: !!response.data
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Sign-in error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      error: 'Internal server error during sign-in',
      message: error.message
    });
  }
});

// Add specific handler for signInWithPassword
app.post('/auth/v1/sign-in-with-password', async (req, res) => {
  try {
    console.log('Handling sign-in-with-password request:', {
      method: req.method,
      path: req.path,
      email: req.body.email,
      hasPassword: !!req.body.password
    });

    const response = await axios.post(
      `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    console.log('Sign-in response:', {
      status: response.status,
      hasData: !!response.data
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Sign-in error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      error: 'Internal server error during sign-in',
      message: error.message
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

// Then service-specific routes
app.get('/api/cv', async (req, res) => {
  try {
    console.log('Handling CV request:', {
      headers: req.headers,
      query: req.query
    });

    if (!req.headers.authorization) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided'
      });
    }

    // Forward request to CV service
    const response = await axios.get(`${process.env.CV_SERVICE_URL}/api/cv`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });

    console.log('CV Service direct response:', {
      status: response.status,
      headers: response.headers
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('CV Service direct error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch CV data'
    });
  }
});

// Finally, the catch-all proxy routes
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