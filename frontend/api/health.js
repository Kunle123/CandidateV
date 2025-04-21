// @ts-check
module.exports = async (req, res) => {
  try {
    // Check Supabase connectivity
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/health`);
    
    if (!response.ok) {
      throw new Error('Supabase health check failed');
    }

    // Check microservices health
    const services = [
      'auth',
      'users',
      'cv',
      'export',
      'ai',
      'payments'
    ];

    const serviceChecks = await Promise.allSettled(
      services.map(async (service) => {
        const serviceUrl = process.env[`VITE_${service.toUpperCase()}_SERVICE_URL`];
        if (!serviceUrl) return { service, status: 'not_configured' };

        try {
          const response = await fetch(`${serviceUrl}/health`);
          return {
            service,
            status: response.ok ? 'healthy' : 'unhealthy',
            statusCode: response.status
          };
        } catch (error) {
          return { service, status: 'error', error: error.message };
        }
      })
    );

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VITE_APP_VERSION || '1.0.0',
      services: serviceChecks.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : { service: 'unknown', status: 'error', error: result.reason }
      )
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
} 