// @ts-check
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with Vercel environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  try {
    // Check Supabase connection by querying health_check table
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('health_check')
      .select('*')
      .limit(1)

    // Log connection attempt for debugging
    console.log('Supabase connection attempt:', {
      hasData: !!supabaseData,
      error: supabaseError?.message || 'none'
    })

    const services = {
      api: {
        status: 'healthy',
        message: 'API is responding normally'
      },
      supabase: {
        status: supabaseError ? 'unhealthy' : 'healthy',
        message: supabaseError 
          ? `Supabase connection failed: ${supabaseError.message}`
          : 'Supabase connection successful'
      }
    }

    const isHealthy = Object.values(services).every(service => service.status === 'healthy')

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      environment: process.env.NODE_ENV || 'unknown'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        api: {
          status: 'error',
          message: error.message
        },
        supabase: {
          status: 'unknown',
          message: 'Unable to check Supabase status'
        }
      }
    })
  }
} 