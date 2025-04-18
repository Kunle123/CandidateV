require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables with explicit defaults
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'https://candidatev-auth-service.up.railway.app',
  user: process.env.USER_SERVICE_URL || 'https://candidatev-user-service.up.railway.app',
  cv: process.env.CV_SERVICE_URL || 'https://candidatev-cv-service.up.railway.app',
  export: process.env.EXPORT_SERVICE_URL || 'https://candidatev-export-service.up.railway.app',
  ai: process.env.AI_SERVICE_URL || 'https://ai-service-production.up.railway.app',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://candidatev-payment-service.up.railway.app'
};

// CORS configuration
const corsOptions = {
  origin: ['https://candidate-v.vercel.app', 'http://localhost:3000', 'http://localhost:5173', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply essential middleware
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Add CORS headers to all responses
app.use((req, res, next) => {
  // Allow requests from any origin in development
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICE_URLS).map(name => ({
      name,
      url: SERVICE_URLS[name]
    }))
  });
});

// Mock auth registration endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Received registration request:', req.body);
  
  // Check if required fields are present
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock successful registration
  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    user: {
      id: `user-${Date.now()}`,
      email: req.body.email,
      created_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Mock auth login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Received login request:');
  console.log('Body:', JSON.stringify(req.body));
  console.log('Headers:', JSON.stringify(req.headers));
  
  try {
    // OAuth style form data handling
    let email = req.body.email;
    let password = req.body.password;
    
    // Handle OAuth2PasswordRequestForm format (username instead of email)
    if (!email && req.body.username) {
      email = req.body.username;
      console.log('Using username field as email:', email);
    }
    
    // Handle URL-encoded form data
    if (!email && req.body.toString().includes('username=')) {
      try {
        const formData = new URLSearchParams(req.body.toString());
        email = formData.get('username');
        password = formData.get('password');
        console.log('Parsed form data:', { email, password: '********' });
      } catch (e) {
        console.error('Failed to parse URL-encoded form data:', e);
      }
    }
    
    // For string body
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
        console.log('Parsed string body:', JSON.stringify(req.body));
        email = req.body.email || req.body.username;
        password = req.body.password;
      } catch (e) {
        console.error('Failed to parse string body:', e);
      }
    }
    
    // For form data or URL encoded
    if (req.body && req.body.data) {
      try {
        const parsedData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
        console.log('Found data field:', JSON.stringify(parsedData));
        
        // Use the parsed data
        if (parsedData.email) email = parsedData.email;
        if (parsedData.username) email = parsedData.username;
        if (parsedData.password) password = parsedData.password;
      } catch (e) {
        console.error('Failed to parse data field:', e);
      }
    }
    
    // Check if required fields are present
    if (!email || !password) {
      console.error('Missing required fields. Body:', JSON.stringify(req.body));
      return res.status(400).json({
        status: 'error',
        message: 'Email/username and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Mock successful login - return in FastAPI/OAuth format
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      access_token: `mock-jwt-token-${Date.now()}`,
      refresh_token: `mock-refresh-token-${Date.now()}`,
      token_type: 'bearer',
      user: {
        id: `user-${Date.now()}`,
        email: email,
        created_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in login endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to see request structure
app.post('/api/debug/echo', (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Request echoed',
      body: req.body,
      headers: req.headers,
      method: req.method,
      path: req.path,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error echoing request',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mock AI job matching endpoint
app.post('/api/ai/job-match/analyze', (req, res) => {
  console.log('Received job matching request:', req.body);
  
  try {
    // Extract CV ID and job description from request
    const { cv_id, job_description, detailed } = req.body;
    
    // Generate a more realistic match score based on job description and CV ID
    let calculatedScore;
    
    // Simple algorithm to generate a score that isn't always the same
    if (job_description) {
      // Use job description length and content to influence score
      const jobLength = job_description.length;
      const hasKeyword1 = job_description.toLowerCase().includes('project') ? 10 : 0;
      const hasKeyword2 = job_description.toLowerCase().includes('management') ? 8 : 0;
      const hasKeyword3 = job_description.toLowerCase().includes('software') ? 15 : 0;
      const hasKeyword4 = job_description.toLowerCase().includes('development') ? 12 : 0;
      
      // Generate a more variable score
      calculatedScore = Math.min(95, Math.max(65, 
        75 + hasKeyword1 + hasKeyword2 + hasKeyword3 + hasKeyword4 + 
        (jobLength % 20) - (jobLength % 7)
      ));
    } else {
      calculatedScore = 78.5; // Default if no job description
    }
    
    console.log(`Generated calculated match score: ${calculatedScore.toFixed(1)}%`);
    
    // Create strengths and weaknesses based on job description
    const strengths = [];
    const weaknesses = [];
    const keywords_found = [];
    const keywords_missing = [];
    
    // Extract potential skills from job description
    const skillKeywords = [
      'project management', 'agile', 'scrum', 'kanban', 'waterfall',
      'javascript', 'python', 'react', 'node', 'java', 'c#', '.net',
      'cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
      'leadership', 'communication', 'teamwork', 'problem-solving'
    ];
    
    // Check for skills in job description
    skillKeywords.forEach(skill => {
      if (job_description && job_description.toLowerCase().includes(skill)) {
        // 70% chance to add as a strength
        if (Math.random() > 0.3) {
          strengths.push(`Good experience with ${skill}`);
          keywords_found.push(skill);
        } else {
          weaknesses.push(`Consider highlighting more ${skill} experience`);
          keywords_missing.push(skill);
        }
      }
    });
    
    // Add some default strengths and weaknesses if we don't have enough
    if (strengths.length < 3) {
      strengths.push("Strong professional experience");
      strengths.push("Relevant educational background");
      strengths.push("Good communication skills highlighted");
    }
    
    if (weaknesses.length < 2) {
      weaknesses.push("Consider adding more specific achievements with metrics");
      weaknesses.push("Some industry keywords might be missing from your CV");
    }
    
    // Create improved mock job match analysis results with calculated score
    const mockResult = {
      match_score: parseFloat(calculatedScore.toFixed(1)),
      cv_id: cv_id,
      overview: "Your CV has been analyzed against the job description. Here's a summary of how well your CV matches the requirements.",
      strengths: strengths.slice(0, 5), // Limit to 5 strengths
      weaknesses: weaknesses.slice(0, 4), // Limit to 4 weaknesses
      keywords_found: keywords_found.slice(0, 6), // Limit to 6 keywords
      keywords_missing: keywords_missing.slice(0, 4), // Limit to 4 keywords
      analysis_timestamp: new Date().toISOString()
    };
    
    console.log('Returning job match analysis with structure:', mockResult);
    
    // Return a properly structured response
    res.status(200).json(mockResult);
  } catch (error) {
    console.error('Error in job matching endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Force real service connection with a specific header
app.use((req, res, next) => {
  // Check for a special header that forces use of the real service
  if (req.headers['x-use-real-service'] === 'true' || req.query.use_real_service === 'true') {
    const servicePath = req.path.split('/')[2]; // Extract service name from path
    if (servicePath && SERVICE_URLS[servicePath]) {
      console.log(`Forcing use of real service for ${req.method} ${req.originalUrl}`);
      return createProxy(servicePath, SERVICE_URLS[servicePath])(req, res, next);
    }
  }
  next();
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working correctly',
    requestHeaders: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Mock CV endpoints
app.get('/api/cv', (req, res) => {
  console.log('Received request for CV list');
  
  // Create mock CV data
  const cvs = [
    {
      id: 'cv-001',
      title: 'Software Developer Resume',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-04-10T14:20:00Z',
      user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
      sections: [
        { id: 'personal', title: 'Personal Information', order: 1 },
        { id: 'education', title: 'Education', order: 2 },
        { id: 'experience', title: 'Work Experience', order: 3 },
        { id: 'skills', title: 'Skills', order: 4 }
      ],
      status: 'active'
    },
    {
      id: 'cv-002',
      title: 'Project Manager CV',
      created_at: '2025-02-20T09:15:00Z',
      updated_at: '2025-04-12T11:45:00Z',
      user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
      sections: [
        { id: 'personal', title: 'Personal Details', order: 1 },
        { id: 'summary', title: 'Professional Summary', order: 2 },
        { id: 'experience', title: 'Project Experience', order: 3 },
        { id: 'education', title: 'Education', order: 4 },
        { id: 'certificates', title: 'Certifications', order: 5 }
      ],
      status: 'active'
    }
  ];
  
  res.status(200).json({
    status: 'success',
    data: cvs,
    count: cvs.length,
    timestamp: new Date().toISOString()
  });
});

// CV detail endpoint
app.get('/api/cv/:id', (req, res) => {
  console.log(`Received request for CV with ID: ${req.params.id}`);
  
  // Create mock CV data based on the requested ID
  const cv = {
    id: req.params.id,
    title: req.params.id === 'cv-001' ? 'Software Developer Resume' : 'Project Manager CV',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-04-10T14:20:00Z',
    user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
    sections: [
      {
        id: 'personal',
        title: 'Personal Information',
        order: 1,
        items: [
          { field: 'name', value: 'John Doe' },
          { field: 'email', value: 'john.doe@example.com' },
          { field: 'phone', value: '+1-555-123-4567' },
          { field: 'location', value: 'New York, NY' }
        ]
      },
      {
        id: 'education',
        title: 'Education',
        order: 2,
        items: [
          {
            title: 'Bachelor of Science in Computer Science',
            institution: 'New York University',
            start_date: '2018-09-01',
            end_date: '2022-05-31',
            description: 'Graduated with honors. Specialized in Software Engineering.'
          }
        ]
      },
      {
        id: 'experience',
        title: 'Work Experience',
        order: 3,
        items: [
          {
            title: 'Software Developer',
            company: 'Tech Solutions Inc.',
            start_date: '2022-06-15',
            end_date: null,
            current: true,
            description: 'Developing and maintaining web applications using React and Node.js.'
          },
          {
            title: 'Intern Developer',
            company: 'WebDev Studios',
            start_date: '2021-06-01',
            end_date: '2021-08-31',
            current: false,
            description: 'Assisted in frontend development and UI/UX improvements.'
          }
        ]
      },
      {
        id: 'skills',
        title: 'Skills',
        order: 4,
        items: [
          { skill: 'JavaScript', level: 'Expert' },
          { skill: 'React', level: 'Advanced' },
          { skill: 'Node.js', level: 'Advanced' },
          { skill: 'Python', level: 'Intermediate' },
          { skill: 'SQL', level: 'Intermediate' }
        ]
      }
    ],
    status: 'active'
  };
  
  res.status(200).json({
    status: 'success',
    data: cv,
    timestamp: new Date().toISOString()
  });
});

// Create CV endpoint
app.post('/api/cv', (req, res) => {
  console.log('Received request to create a new CV:', req.body);
  
  // Create a new CV with the provided data or defaults
  const newCV = {
    id: `cv-${Date.now()}`,
    title: req.body.title || 'Untitled CV',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
    sections: req.body.sections || [
      { id: 'personal', title: 'Personal Information', order: 1 },
      { id: 'education', title: 'Education', order: 2 },
      { id: 'experience', title: 'Work Experience', order: 3 },
      { id: 'skills', title: 'Skills', order: 4 }
    ],
    status: 'active'
  };
  
  res.status(201).json({
    status: 'success',
    message: 'CV created successfully',
    data: newCV,
    timestamp: new Date().toISOString()
  });
});

// Update CV endpoint
app.put('/api/cv/:id', (req, res) => {
  console.log(`Received request to update CV with ID: ${req.params.id}`, req.body);
  
  // Return the updated CV (combine request data with existing mock data)
  const updatedCV = {
    id: req.params.id,
    title: req.body.title || 'Updated CV',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: new Date().toISOString(),
    user_id: req.headers.authorization ? 'user-from-token' : 'anonymous-user',
    sections: req.body.sections || [
      { id: 'personal', title: 'Personal Information', order: 1 },
      { id: 'education', title: 'Education', order: 2 },
      { id: 'experience', title: 'Work Experience', order: 3 },
      { id: 'skills', title: 'Skills', order: 4 }
    ],
    status: req.body.status || 'active'
  };
  
  res.status(200).json({
    status: 'success',
    message: 'CV updated successfully',
    data: updatedCV,
    timestamp: new Date().toISOString()
  });
});

// Delete CV endpoint
app.delete('/api/cv/:id', (req, res) => {
  console.log(`Received request to delete CV with ID: ${req.params.id}`);
  
  res.status(200).json({
    status: 'success',
    message: `CV with ID ${req.params.id} deleted successfully`,
    timestamp: new Date().toISOString()
  });
});

// Create proxy middleware function
const createProxy = (serviceName, targetUrl) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    timeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging
      console.log(`Proxying ${req.method} request to ${serviceName}: ${req.path}`);
      
      // Add debugging headers
      proxyReq.setHeader('X-Proxy-Service', serviceName);
      proxyReq.setHeader('X-Proxy-Target', targetUrl);
      proxyReq.setHeader('X-Original-URL', req.originalUrl);
    },
    pathRewrite: (path, req) => {
      // For OPTIONS requests, return null to prevent proxying
      if (req.method === 'OPTIONS') {
        return null;
      }
      // Log the path rewrite for debugging
      console.log(`Path rewrite: ${path} -> ${path}`);
      return path;
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}: ${err.message}`, {
        service: serviceName,
        targetUrl,
        originalUrl: req.originalUrl,
        path: req.path,
        method: req.method,
        error: err.message
      });
      
      // For OPTIONS requests, handle directly
      if (req.method === 'OPTIONS') {
        // Allow requests from any origin in development
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          res.header('Access-Control-Allow-Origin', '*');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        res.status(200).end();
        return;
      }
      
      // Set proper CORS headers in error response
      const origin = req.headers.origin;
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        res.header('Access-Control-Allow-Origin', '*');
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      res.status(503).json({
        status: 'error',
        message: `${serviceName} service temporarily unavailable`,
        error: err.message,
        originalUrl: req.originalUrl,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Set up service routes - Note: These will only be used if a request doesn't match our local routes
app.use('/api/auth', (req, res, next) => {
  // We have local implementations for these auth routes
  if (req.path === '/register' || req.path === '/login') {
    return next('route'); // Skip the proxy for these routes
  }
  return createProxy('auth', SERVICE_URLS.auth)(req, res, next);
});

app.use('/api/users', createProxy('user', SERVICE_URLS.user));

// Modified CV proxy to prioritize local implementations except for AI optimization
app.use('/api/cv', (req, res, next) => {
  // Pass through AI optimization requests to the real service
  if (req.path.includes('/optimize') || req.path.includes('/ai') || req.originalUrl.includes('/optimize') || req.originalUrl.includes('/ai')) {
    console.log('Forwarding AI optimization request to the real CV service:', req.originalUrl);
    return createProxy('cv', SERVICE_URLS.cv)(req, res, next);
  }
  
  // Extract the path parts
  const pathParts = req.path.split('/').filter(Boolean);
  const isRootPath = pathParts.length === 0;
  const hasId = pathParts.length > 0;
  
  // For other CV endpoints, use our local mock implementations
  // Use next('route') only for paths that we've already defined as middleware above
  if (req.method === 'GET' && isRootPath) {
    // The root CV endpoint (list CVs) is handled by our mock implementation
    console.log('Using mock implementation for GET /api/cv');
    return next('route');
  } else if (req.method === 'GET' && hasId && !pathParts[0].includes('optimize') && !pathParts[0].includes('ai')) {
    // The CV detail endpoint is handled by our mock implementation unless it's an optimization request
    console.log(`Using mock implementation for GET /api/cv/${pathParts[0]}`);
    return next('route');
  } else if (req.method === 'POST' && isRootPath) {
    // The create CV endpoint is handled by our mock implementation
    console.log('Using mock implementation for POST /api/cv');
    return next('route');
  } else if (req.method === 'PUT' && hasId) {
    // The update CV endpoint is handled by our mock implementation
    console.log(`Using mock implementation for PUT /api/cv/${pathParts[0]}`);
    return next('route');
  } else if (req.method === 'DELETE' && hasId) {
    // The delete CV endpoint is handled by our mock implementation
    console.log(`Using mock implementation for DELETE /api/cv/${pathParts[0]}`);
    return next('route');
  }
  
  // Log the request that's being forwarded
  console.log(`Forwarding request to real CV service: ${req.method} ${req.originalUrl}`);
  
  // For anything else, try the real service
  return createProxy('cv', SERVICE_URLS.cv)(req, res, next);
});

app.use('/api/export', createProxy('export', SERVICE_URLS.export));

// Modified AI service proxy to prioritize local implementations
app.use('/api/ai', (req, res, next) => {
  // Check if it's a job matching request - use our mock implementation
  if (req.path.includes('/job-match/analyze')) {
    console.log('Using mock implementation for job matching:', req.method, req.originalUrl);
    // For GET requests or if this path doesn't exactly match our mock implementation
    if (req.method !== 'POST') {
      console.log('Non-POST request for job matching, forwarding to real service');
      return createProxy('ai', SERVICE_URLS.ai)(req, res, next);
    }
    
    // This will be caught by our mock endpoint handler defined earlier
    return next('route');
  }
  
  // For real AI endpoint access when specifically requested
  if (req.headers['x-use-real-service'] === 'true' || req.query.use_real_service === 'true') {
    console.log('Forcing use of real AI service due to header/query param:', req.originalUrl);
    return createProxy('ai', SERVICE_URLS.ai)(req, res, next);
  }
  
  console.log('Forwarding AI service request to real service:', req.originalUrl);
  return createProxy('ai', SERVICE_URLS.ai)(req, res, next);
});

app.use('/api/payments', createProxy('payment', SERVICE_URLS.payment));

// Default 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  
  // Set proper CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_routes: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/cv',
      '/api/cv/:id',
      '/api/ai/job-match/analyze',
      '/api/debug/echo'
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simplified API Gateway running on port ${PORT}`);
  console.log('\nConfigured Services:');
  Object.entries(SERVICE_URLS).forEach(([service, url]) => {
    console.log(`- ${service.toUpperCase()} Service: ${url}`);
  });
});

module.exports = app; 