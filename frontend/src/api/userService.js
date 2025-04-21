import { profileHelper, preferencesHelper } from '../lib/supabaseDb';
import { retryApiCall } from './utils';
import { supabase } from '../lib/supabase';

// User profile service
const userService = {
  // Get current user profile
  async getCurrentProfile() {
    return await profileHelper.getCurrentProfile();
  },

  // Get current user profile with retry on network errors
  async getCurrentProfileWithRetry() {
    try {
      const result = await retryApiCall(
        () => profileHelper.getCurrentProfile(),
        { maxRetries: 3 }
      );
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error.message
      };
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    return await profileHelper.updateProfile(profileData);
  },

  // Update user preferences
  async updatePreferences(preferences) {
    return await preferencesHelper.updatePreferences(preferences);
  },

  // Upload profile image
  async uploadProfileImage(file) {
    return await profileHelper.uploadProfileImage(file);
  },

  // Delete profile image
  async deleteProfileImage() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Delete the image from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-images')
        .remove([`${user.id}/profile`]);

      if (deleteError) throw deleteError;

      // Update profile to remove image URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error.message
      };
    }
  }
};

export default userService; 