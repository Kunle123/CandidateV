import { apiService } from '../apiClient';

/**
 * CV Service - handles all CV-related API calls
 */
const cvService = {
  /**
   * Get all user CVs
   * @returns {Promise} API response with CV list
   */
  getUserCVs: () => {
    return apiService.get('cv/user');
  },

  /**
   * Get CV by ID
   * @param {string} cvId - CV identifier
   * @returns {Promise} API response with CV details
   */
  getCV: (cvId) => {
    return apiService.get(`cv/${cvId}`);
  },

  /**
   * Optimize CV against a job description
   * @param {string} cvId - CV identifier
   * @param {Object} data - Optimization parameters
   * @param {string} data.jobDescription - Job description text
   * @param {string} data.companyName - Optional company name
   * @param {string} data.position - Optional position name
   * @param {boolean} data.includeKeywords - Whether to include keyword analysis
   * @returns {Promise} API response with optimization results
   */
  optimizeCV: (cvId, data) => {
    return apiService.post(`cv/${cvId}/optimize`, data);
  },

  /**
   * Generate cover letter
   * @param {string} cvId - CV identifier
   * @param {Object} data - Cover letter parameters
   * @param {string} data.jobDescription - Job description text
   * @param {string} data.companyName - Company name
   * @param {string} data.position - Position title
   * @param {string} data.recipientName - Optional recipient name
   * @param {string} data.userComments - Optional user instructions
   * @returns {Promise} API response with generated cover letter
   */
  generateCoverLetter: (cvId, data) => {
    return apiService.post(`cv/${cvId}/cover-letter`, data);
  },

  /**
   * Get template list
   * @returns {Promise} API response with template list
   */
  getTemplates: () => {
    return apiService.get('cv/templates');
  },
  
  /**
   * Save optimization results
   * @param {string} cvId - CV identifier 
   * @param {Object} data - Optimization data to save
   * @returns {Promise} API response with save confirmation
   */
  saveOptimizationResults: (cvId, data) => {
    return apiService.post(`cv/${cvId}/save-optimization`, data);
  }
};

export default cvService; 