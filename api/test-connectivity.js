// Create a test file to manually check connections to the services
const axios = require('axios');

module.exports = async (req, res) => {
  const services = {
    auth: process.env.AUTH_SERVICE_URL || "https://candidatev-production-b758.up.railway.app",
    user: process.env.USER_SERVICE_URL || "https://candidatev-production-346e.up.railway.app",
    cv: process.env.CV_SERVICE_URL || "https://candidatev-production.up.railway.app"
  };

  const results = {};

  for (const [name, url] of Object.entries(services)) {
    try {
      console.log(`Testing connection to ${name} service at ${url}/api/health`);
      const start = Date.now();
      const response = await axios.get(`${url}/api/health`, {
        timeout: 5000, // 5-second timeout
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
    } catch (error) {
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
    results
  });
}; 