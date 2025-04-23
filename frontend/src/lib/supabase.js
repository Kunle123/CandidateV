/**
 * Supabase Client Configuration and Auth Helpers
 * 
 * This file serves as the central configuration point for Supabase in the application.
 * It exports:
 * - supabase: The main Supabase client instance
 * - auth: Direct access to Supabase auth
 * - authHelper: A collection of wrapped auth methods with error handling
 * 
 * For testing: Use the standard environment variables (VITE_SUPABASE_*).
 * For development/production: Variables are loaded from import.meta.env
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://api-gw-production.up.railway.app'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!apiGatewayUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables')
}

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'candidatev-auth-token'
  },
  global: {
    headers: {
      'x-my-custom-header': 'CandidateV'
    }
  }
}

// Create Supabase client with API gateway URL
console.log('Creating Supabase client with config:', {
  url: apiGatewayUrl,
  hasAnonKey: !!supabaseAnonKey,
  options
});

const supabase = createClient(apiGatewayUrl, supabaseAnonKey, options)

// Export the Supabase instance
export { supabase }

// Export direct auth access
export const auth = supabase.auth

// Auth helper functions with consistent error handling
export const authHelper = {
  async signUp({ email, password, name, terms_accepted }) {
    console.log('Starting signup with:', { email, hasPassword: !!password, name, terms_accepted });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          terms_accepted,
          terms_accepted_at: new Date().toISOString()
        },
        emailRedirectTo: window.location.origin
      }
    })
    
    if (error) throw error
    return { data, error }
  },

  async signInWithPassword({ email, password }) {
    console.log('Starting login attempt for:', { email });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: true
        }
      })
      
      console.log('Login response:', { data, error });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data?.session) {
        console.error('No session in response:', data);
        throw new Error('No session data returned from login');
      }

      console.log('Login successful, session:', data.session);
      return { data, error };
    } catch (error) {
      console.error('Login caught error:', error);
      throw error;
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
} 