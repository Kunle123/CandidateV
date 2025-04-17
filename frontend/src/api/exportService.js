import apiClient from './apiClient';

// Export service for CV exports in various formats
const exportService = {
  // Get available export formats
  async getExportFormats() {
    try {
      const response = await apiClient.get('/export/formats');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch export formats'
      };
    }
  },

  // Get all export jobs
  async getExportJobs() {
    try {
      const response = await apiClient.get('/export');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch export jobs'
      };
    }
  },

  // Get a specific export job
  async getExportJob(exportId) {
    try {
      const response = await apiClient.get(`/export/${exportId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch export job'
      };
    }
  },

  // Create a new export job
  async createExport(exportData) {
    try {
      const response = await apiClient.post('/export', exportData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to create export job'
      };
    }
  },

  // Download an exported file
  async downloadExport(exportId) {
    try {
      // Using a different approach for file downloads
      const response = await apiClient.get(`/export/download/${exportId}`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Try to get filename from content-disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'export.pdf'; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to download export'
      };
    }
  }
};

export default exportService; 