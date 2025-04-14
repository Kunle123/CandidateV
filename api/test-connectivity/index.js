// Create a test file to manually check connections to the services
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const services = {
    auth: process.env.AUTH_SERVICE_URL || "https://candidatev-production-b758.up.railway.app",
    user: process.env.USER_SERVICE_URL || "https://candidatev-production-346e.up.railway.app",
    cv: process.env.CV_SERVICE_URL || "https://candidatev-production.up.railway.app"
  };

  console.log("Starting connectivity tests with services:", services);

  const results = {};

  for (const [name, url] of Object.entries(services)) {
    try {
      console.log(`Testing connection to ${name} service at ${url}/api/health`);
      const start = Date.now();
      const response = await axios.get(`${url}/api/health`, {
        timeout: 10000, // 10-second timeout
        headers: {
          'User-Agent': 'Vercel-API-Gateway-Test'
        }
      });
      const duration = Date.now() - start;

      results[name] = {
        status: 'success',
        statusCode: response.status,
        duration: `${duration}ms`,
        data: response.data
      };
      console.log(`Successfully connected to ${name} service in ${duration}ms`);
    } catch (error) {
      console.error(`Error connecting to ${name} service:`, error.message);
      results[name] = {
        status: 'error',
        message: error.message,
        code: error.code || 'UNKNOWN',
        isAxiosError: !!error.isAxiosError,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      };
    }
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    vercelEnvironment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    },
    results
  });
}; 