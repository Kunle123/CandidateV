/**
 * Supabase Database Helpers
 * 
 * This file contains helper functions for database operations using Supabase.
 * It provides structured access to:
 * - Profile management (CRUD operations)
 * - User preferences
 * - Activity logging
 * 
 * All functions follow a consistent pattern:
 * - Automatic user context
 * - Consistent error handling
 * - Standard response format { success, data, error }
 */

import { supabase } from './supabase'

// Profile operations
export const profileHelper = {
  async getCurrentProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      }
    }
  },

  async updateProfile(profileData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  async uploadProfileImage(file) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/profile.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl }, error: urlError } = await supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      if (urlError) throw urlError

      // Update profile with new image URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// User preferences operations
export const preferencesHelper = {
  async getCurrentPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  async updatePreferences(preferences) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Activity logging
export const activityHelper = {
  async logActivity(action, details = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action,
          details,
          ip_address: '', // Will be set by RLS policy
          user_agent: navigator.userAgent
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  async getActivityLogs(limit = 10) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
} 