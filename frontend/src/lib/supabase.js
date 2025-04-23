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
const apiGatewayUrl = import.meta.env.VITE_API_BASE_URL || 'https://api-gw-production.up.railway.app'
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
    storageKey: 'candidatev-auth-token',
    headers: {
      'x-my-custom-header': 'CandidateV',
      'Content-Type': 'application/json'
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

// Map Supabase error codes to user-friendly messages
const errorMessages = {
  'user_already_registered': 'This email is already registered. Please log in or reset your password.',
  'invalid_email': 'The email address is invalid.',
  'invalid_password': 'The password is invalid or too weak.',
  'email_not_confirmed': 'Please verify your email before logging in.',
  'invalid_login_credentials': 'Incorrect email or password.',
  'unverified_email': 'Please verify your email before logging in.',
  'rate_limit_exceeded': 'Too many attempts. Please try again later.',
  'user_blocked': 'Your account has been blocked. Contact support.',
  'default': 'An unexpected error occurred. Please try again.'
};

function mapSupabaseError(error) {
  if (!error) return errorMessages.default;
  if (error.message && errorMessages[error.message]) return errorMessages[error.message];
  if (error.code && errorMessages[error.code]) return errorMessages[error.code];
  return error.message || errorMessages.default;
}

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
    
    if (error) throw new Error(mapSupabaseError(error));
    return { data, error };
  },

  async signInWithPassword({ email, password }) {
    console.log('Starting login attempt for:', { email });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          redirectTo: window.location.origin,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      })
      
      console.log('Login response:', { data, error });
      
      if (error) {
        console.error('Login error:', error);
        throw new Error(mapSupabaseError(error));
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