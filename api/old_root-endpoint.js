// Root endpoint handler for the API Gateway
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return basic information about the API Gateway
  return res.status(200).json({
    service: "CandidateV API Gateway",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      debug: "/api/debug",
      auth: "/api/auth/*",
      users: "/api/users/*",
      cv: "/api/cv/*"
    },
    timestamp: new Date().toISOString()
  });
}; 