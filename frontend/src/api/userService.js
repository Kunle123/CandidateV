import apiClient from './apiClient';
import config from './config';
import { retryApiCall, formatApiError } from './utils';

// User profile service
const userService = {
  // Get current user profile
  async getCurrentProfile() {
    try {
      const response = await apiClient.get(config.endpoints.user.profile);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },

  // Get current user profile with retry on network errors
  async getCurrentProfileWithRetry() {
    try {
      const response = await retryApiCall(
        () => apiClient.get(config.endpoints.user.profile),
        { maxRetries: 3 }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.patch(config.endpoints.user.profile, profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await apiClient.patch(config.endpoints.user.preferences, preferences);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },

  // Upload profile image
  async uploadProfileImage(formData) {
    try {
      const response = await apiClient.post(`${config.endpoints.user.profile}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },

  // Delete profile image
  async deleteProfileImage() {
    try {
      await apiClient.delete(`${config.endpoints.user.profile}/profile-image`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  }
};

export default userService; 