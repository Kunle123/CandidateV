import axios from 'axios';
import { getAuthHeader } from './utils';
import apiClient, { apiService } from './apiClient';

// Use apiClient instead of direct axios calls with relative paths
// This ensures all requests use the correct base URL from apiClient

/**
 * Service for CV-related API calls
 */
const cvService = {
  // Get all templates
  getTemplates: async () => {
    try {
      // Use apiService helper that auto-adds /api prefix correctly
      const response = await apiService.get('cv/templates', {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching CV templates:', error);
      throw error;
    }
  },

  // Get user's CVs
  getCVs: async () => {
    try {
      // Use apiService helper that auto-adds /api prefix correctly
      const response = await apiService.get('cv', {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user CVs:', error);
      throw error;
    }
  },

  // Get a specific CV by ID
  getCV: async (id) => {
    try {
      const response = await apiService.get(`cv/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching CV with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new CV
  createCV: async (cvData) => {
    try {
      const response = await apiService.post('cv', cvData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating CV:', error);
      throw error;
    }
  },

  // Update an existing CV
  updateCV: async (id, cvData) => {
    try {
      const response = await apiService.put(`cv/${id}`, cvData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating CV with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a CV
  deleteCV: async (id) => {
    try {
      const response = await apiService.delete(`cv/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting CV with ID ${id}:`, error);
      throw error;
    }
  },

  // Export a CV to different formats
  exportCV: async (id, format) => {
    try {
      const response = await apiService.get(`export/cv/${id}?format=${format}`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error exporting CV with ID ${id} to ${format}:`, error);
      throw error;
    }
  },

  // Get available export formats
  getExportFormats: async () => {
    try {
      const response = await apiService.get('export/formats', {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching export formats:', error);
      throw error;
    }
  },

  // Get a shared CV by its shared ID (public access)
  getSharedCV: async (sharedId) => {
    try {
      const response = await apiService.get(`cv/shared/${sharedId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching shared CV with ID ${sharedId}:`, error);
      throw error;
    }
  },

  // Generate a share link for a CV
  shareCV: async (id) => {
    try {
      const response = await apiService.post(`cv/${id}/share`, null, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error sharing CV with ID ${id}:`, error);
      throw error;
    }
  },

  // Upload a new CV from a file
  uploadCV: async (file) => {
    const formData = new FormData();
    formData.append('file', file); // The backend CV service needs to expect a field named 'file'

    try {
      const response = await apiService.post('cv', formData, {
        headers: {
          ...getAuthHeader(),
          // 'Content-Type': 'multipart/form-data' // Let browser set this automatically for FormData
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading CV:', error);
      throw error;
    }
  }
};

export default cvService; 