// @ts-check
import fetch from 'node-fetch';

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
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

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VITE_APP_VERSION || '1.0.0',
      services: serviceChecks.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : { service: 'unknown', status: 'error', error: result.reason }
      )
    }));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 503;
    res.end(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }));
  }
} 