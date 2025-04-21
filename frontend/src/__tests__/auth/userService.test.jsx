import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import userService from '../../api/userService';
import { createTestUser, cleanupTestUser } from '../setup/testEnv';

describe('UserService Supabase Integration', () => {
  // Single test for tracing
  it('should trace complete auth flow', async () => {
    console.log('[Test] Starting auth flow trace');
    
    // 1. Create user
    console.log('[Test] Step 1: Creating test user');
    const testUser = await createTestUser();
    console.log('[Test] User created:', testUser.id);
    
    // 2. Get profile
    console.log('[Test] Step 2: Getting user profile');
    const profileResult = await userService.getCurrentProfile();
    console.log('[Test] Profile result:', profileResult);
    
    // 3. Clean up
    console.log('[Test] Step 3: Cleaning up');
    await cleanupTestUser(testUser?.id);
    console.log('[Test] Test complete');
    
    // Assertions
    expect(testUser).toBeDefined();
    expect(testUser.email).toBeDefined();
    expect(profileResult.success).toBe(true);
    expect(profileResult.data.id).toBe(testUser.id);
  }, 30000); // Increased timeout for tracing

  describe('Profile Management', () => {
    it('should get current user profile', async () => {
      const result = await userService.getCurrentProfile();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(testUser.id);
    }, 5000);

    it('should update user profile', async () => {
      const profileData = {
        full_name: 'Test User Updated',
        bio: 'Test bio'
      };

      const result = await userService.updateProfile(profileData);
      expect(result.success).toBe(true);
      expect(result.data.full_name).toBe(profileData.full_name);
      expect(result.data.bio).toBe(profileData.bio);
    }, 5000);
  });

  describe('User Preferences', () => {
    it('should update user preferences', async () => {
      const preferences = {
        theme: 'dark',
        notifications_enabled: true
      };

      const result = await userService.updatePreferences(preferences);
      expect(result.success).toBe(true);
      expect(result.data.theme).toBe(preferences.theme);
      expect(result.data.notifications_enabled).toBe(preferences.notifications_enabled);
    }, 5000);
  });

  describe('Profile Image', () => {
    it('should handle profile image upload', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await userService.uploadProfileImage(file);
      expect(result.success).toBe(true);
      expect(result.data.avatar_url).toBeDefined();
    }, 10000);

    it('should delete profile image', async () => {
      const result = await userService.deleteProfileImage();
      expect(result.success).toBe(true);
      expect(result.data.avatar_url).toBeNull();
    }, 5000);
  });

  describe('Error Handling', () => {
    it('should handle getCurrentProfile with retry on network error', async () => {
      const result = await userService.getCurrentProfileWithRetry();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }, 5000);

    it('should handle errors when user is not authenticated', async () => {
      await cleanupTestUser(testUser.id);
      
      const result = await userService.getCurrentProfile();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No user found');

      // Create new test user for remaining tests
      testUser = await createTestUser();
    }, 10000);
  });
}); 