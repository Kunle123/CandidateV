// @ts-check
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with Vercel environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Basic API health check
    const apiStatus = {
      status: 'healthy',
      message: 'API is responding normally'
    }

    // Check Supabase connection
    let supabaseStatus
    try {
      const { data, error } = await supabase
        .from('health_check')
        .select('*')
        .limit(1)
        .single()

      supabaseStatus = {
        status: error ? 'unhealthy' : 'healthy',
        message: error 
          ? `Supabase connection error: ${error.message}`
          : 'Supabase connection successful',
        timestamp: data?.timestamp || null
      }
    } catch (dbError) {
      console.error('Supabase health check failed:', dbError)
      supabaseStatus = {
        status: 'unhealthy',
        message: `Failed to connect to Supabase: ${dbError.message}`,
        timestamp: null
      }
    }

    const services = {
      api: apiStatus,
      supabase: supabaseStatus
    }

    const isHealthy = Object.values(services).every(service => service.status === 'healthy')

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      environment: process.env.NODE_ENV || 'production'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        api: {
          status: 'error',
          message: 'Internal server error during health check'
        },
        supabase: {
          status: 'unknown',
          message: 'Unable to check Supabase status'
        }
      }
    })
  }
} 