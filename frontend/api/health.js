export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
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

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.VITE_APP_VERSION || '1.0.0',
        services: serviceChecks.map(result => result.value)
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 