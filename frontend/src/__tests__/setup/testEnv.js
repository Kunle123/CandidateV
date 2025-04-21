// Set up test environment variables
import { beforeAll, afterAll, vi } from 'vitest';
import { supabase } from '../../lib/supabase';

// Set up environment variables for testing
process.env.VITE_SUPABASE_URL = 'https://aqmybjkzxfwiizorveco.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXliamt6eGZ3aWl6b3J2ZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDU1NTYsImV4cCI6MjA2MDgyMTU1Nn0.Ais3ZEu95OyqitcscyfmztxogCqcqrHjo9BZWPrqQKw';

// Mock File API for Node.js environment
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options = {}) {
      this.bits = bits;
      this.name = name;
      this.options = options;
    }
  };
}

// Log the environment setup
console.log('[Test Setup] Environment variables:', {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  // Don't log the full key for security
  SUPABASE_KEY_PREFIX: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
});

// Verify Supabase client
const verifySupabaseConnection = async () => {
  console.log('[Test Setup] Verifying Supabase connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('[Test Setup] Get session result:', { data, error });
    
    if (error) {
      console.error('[Test Setup] Supabase connection error:', error);
      return false;
    }
    
    console.log('[Test Setup] Supabase connection verified');
    return true;
  } catch (e) {
    console.error('[Test Setup] Error verifying connection:', e);
    return false;
  }
};

// Test the signup process directly
const testSignup = async () => {
  const email = 'test.direct@example.com';
  const password = 'Test123!@#';
  
  console.log('Attempting test signup with email:', email);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
    
    console.log('Signup successful:', data);
    return data;
  } catch (error) {
    console.error('Signup process failed:', error);
    throw error;
  }
};

// Run initial verification
beforeAll(async () => {
  console.log('[Test Setup] Starting test environment setup');
  const isConnected = await verifySupabaseConnection();
  if (!isConnected) {
    throw new Error('Failed to verify Supabase connection');
  }
  console.log('[Test Setup] Environment setup complete');
});

// Generate a random string for email
const generateRandomString = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

// Cleanup function to be used after tests
export const cleanupTestUser = async (userId) => {
  if (userId) {
    console.log('[Test Cleanup] Starting cleanup for user:', userId);
    try {
      // First sign out
      console.log('[Test Cleanup] Signing out...');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('[Test Cleanup] Sign out error:', signOutError);
      }

      // Then delete data
      console.log('[Test Cleanup] Deleting profile data...');
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
      if (profileError) {
        console.error('[Test Cleanup] Profile deletion error:', profileError);
      }

      console.log('[Test Cleanup] Deleting preferences...');
      const { error: prefError } = await supabase.from('user_preferences').delete().eq('user_id', userId);
      if (prefError) {
        console.error('[Test Cleanup] Preferences deletion error:', prefError);
      }

      console.log('[Test Cleanup] Cleanup completed for user:', userId);
    } catch (error) {
      console.error('[Test Cleanup] Unexpected error:', error);
    }
  }
};

// Create test user function
export const createTestUser = async () => {
  const uniqueId = generateRandomString();
  const email = `test.user.${uniqueId}@example.com`;
  const password = 'Test123!@#';

  console.log('[Test User] Creating test user:', { email });

  try {
    // First ensure we're signed out
    console.log('[Test User] Signing out any existing session...');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('[Test User] Sign out error:', signOutError);
    }

    // Create new user
    console.log('[Test User] Attempting signup...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (error) {
      console.error('[Test User] Signup error:', error);
      throw error;
    }

    if (!data.user) {
      console.error('[Test User] No user data returned');
      throw new Error('No user returned from signUp');
    }

    console.log('[Test User] User created:', {
      id: data.user.id,
      email: data.user.email
    });

    // Sign in as the test user
    console.log('[Test User] Attempting signin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[Test User] Signin error:', signInError);
      throw signInError;
    }

    console.log('[Test User] Signin successful:', {
      id: signInData.user.id,
      email: signInData.user.email
    });

    return data.user;
  } catch (error) {
    console.error('[Test User] Unexpected error:', error);
    throw error;
  }
}; 