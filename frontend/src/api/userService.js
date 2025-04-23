import axios from 'axios';
import config from './config';

const api = axios.create({
  baseURL: config.USER_API_URL,
  withCredentials: true
});

// User profile service
const userService = {
  // Get current user profile
  async getCurrentProfile() {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(profileData) {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },

  // Update user preferences
  async updatePreferences(preferences) {
    const response = await api.put('/user/preferences', preferences);
    return response.data;
  },

  // Upload profile image
  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/user/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Delete profile image
  async deleteProfileImage() {
    const response = await api.delete('/user/profile/image');
    return response.data;
  }
};

export default userService; 