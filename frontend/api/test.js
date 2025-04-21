export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'API route is working',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
} 