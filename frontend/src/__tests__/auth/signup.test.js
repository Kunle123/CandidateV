import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { createTestUser, cleanupTestUser } from '../setup/testEnv';

describe('Signup Flow', () => {
  let testUserId = null;

  // Clean up after each test
  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
    await supabase.auth.signOut();
    // Wait a bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should successfully create a new user account', async () => {
    try {
      const user = await createTestUser();
      testUserId = user.id;
      
      expect(user).toBeTruthy();
      expect(user.email).toMatch(/test\.user\..+@example\.com/);
      expect(user.user_metadata.full_name).toBe('Test User');
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }, 15000);

  it('should fail with invalid email format', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'invalid-email',
      password: 'Test123!@#',
      options: {
        data: {
          full_name: 'Test User',
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        }
      }
    });

    expect(error).toBeTruthy();
    expect(error.message).toMatch(/invalid.*email/i);
    expect(data.user).toBeFalsy();
  });

  it('should fail with weak password', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: `test.${Date.now()}@example.com`,
      password: 'weak',
      options: {
        data: {
          full_name: 'Test User',
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        }
      }
    });

    expect(error).toBeTruthy();
    expect(error.message).toMatch(/password/i);
    expect(data.user).toBeFalsy();
  });

  it('should allow user to sign in after signup', async () => {
    try {
      // Create a test user
      const user = await createTestUser();
      testUserId = user.id;
      const email = user.email;
      const password = 'Test123!@#';

      // Sign out first
      await supabase.auth.signOut();
      
      // Wait for signout to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      expect(signInError).toBeNull();
      expect(signInData.user).toBeTruthy();
      expect(signInData.user.email).toBe(email);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }, 20000);

  it('should handle duplicate email signup', async () => {
    try {
      // Create first user
      const user = await createTestUser();
      testUserId = user.id;
      const email = user.email;

      // Try to signup again with same email
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Test123!@#',
        options: {
          data: {
            full_name: 'Test User 2',
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString()
          }
        }
      });

      expect(error).toBeTruthy();
      expect(error.message).toMatch(/email.*taken|already.*registered/i);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }, 15000);

  it('should validate required fields', async () => {
    // Test missing email
    const { error: emailError } = await supabase.auth.signUp({
      password: 'Test123!@#'
    });
    expect(emailError).toBeTruthy();
    expect(emailError.message).toMatch(/email.*required|missing.*email/i);

    // Test missing password
    const timestamp = Date.now();
    const { error: passwordError } = await supabase.auth.signUp({
      email: `test.${timestamp}@example.com`
    });
    expect(passwordError).toBeTruthy();
    expect(passwordError.message).toMatch(/password.*required|missing.*password/i);

    // Test missing both
    const { error: bothError } = await supabase.auth.signUp({});
    expect(bothError).toBeTruthy();
    expect(bothError.message).toMatch(/required|missing/i);
  });
});

describe('User Signup', () => {
  it('should create a new user account', async () => {
    // Generate a unique email using timestamp
    const timestamp = Date.now();
    const testUser = {
      email: `test.${timestamp}@example.com`,
      password: 'Test123!@#',
      name: 'Test User'
    };

    console.log('Testing signup with:', testUser.email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            full_name: testUser.name
          }
        }
      });

      // Log the response for debugging
      if (error) {
        console.error('Signup error:', error);
      } else {
        console.log('Signup successful:', {
          userId: data.user?.id,
          email: data.user?.email
        });
      }

      // Assertions
      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.user_metadata.full_name).toBe(testUser.name);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }, 15000); // Increase timeout to 15 seconds for network request
});

describe('Basic Signup Test', () => {
  it('should create a new user account', async () => {
    // Log Supabase configuration
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10));

    const testUser = {
      email: `test.${Date.now()}@example.com`,
      password: 'Test123!@#'
    };

    console.log('Attempting signup with:', {
      email: testUser.email,
      passwordLength: testUser.password.length
    });

    try {
      // First check if we're already signed in
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log('Found existing session, signing out first...');
        await supabase.auth.signOut();
      }

      // Attempt signup
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          emailRedirectTo: 'http://localhost:3000'
        }
      });

      // Detailed response logging
      console.log('Signup Response:', {
        success: !error,
        error: error ? {
          name: error.name,
          message: error.message,
          status: error.status,
          statusText: error.statusText
        } : null,
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          lastSignIn: data.user.last_sign_in_at,
          role: data.user.role,
          metadata: data.user.user_metadata
        } : null,
        session: data?.session ? 'Present' : 'None'
      });

      // Assertions with detailed error messages
      if (error) {
        console.error('❌ Signup failed:', {
          error: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data?.user) {
        console.error('❌ No user data returned');
        throw new Error('No user data in response');
      }

      console.log('✅ Test completed successfully');
      
      // Clean up
      if (data?.user?.id) {
        console.log('Cleaning up test user...');
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('❌ Test failed with error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }, 20000);
}); 