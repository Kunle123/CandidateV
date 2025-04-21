import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const auth = supabase.auth

// Auth helper functions
export const authHelper = {
  signUp: async ({ email, password, ...data }) => {
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ...data }
      }
    })
    if (error) {
      console.error('Signup error:', error)
      throw error
    }
    return user
  },

  signInWithPassword: async ({ email, password }) => {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
    return user
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) {
      console.error('Password reset error:', error)
      throw error
    }
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) {
      console.error('Password update error:', error)
      throw error
    }
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Get user error:', error)
      throw error
    }
    return user
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
} 