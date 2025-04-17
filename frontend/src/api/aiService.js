import apiClient from './apiClient';
import { formatApiError } from './utils';

// AI service for CV analysis and optimization
const aiService = {
  // Analyze CV using AI to get feedback and suggestions
  async analyzeCV(cvId, sections = null) {
    try {
      const payload = { cv_id: cvId };
      if (sections) {
        payload.sections = sections;
      }
      
      const response = await apiClient.post('/ai/analyze', payload);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },

  // Optimize specific sections of a CV
  async optimizeCV(cvId, targets) {
    try {
      const response = await apiClient.post('/ai/optimize', {
        cv_id: cvId,
        targets: targets
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },
  
  // Get job match score for CV against a job description
  async getJobMatch(cvId, jobDescription) {
    try {
      const response = await apiClient.post('/ai/job-match', {
        cv_id: cvId,
        job_description: jobDescription
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },
  
  // Get detailed job application analysis
  async getJobMatchAnalysis(cvId, jobDescription) {
    try {
      const response = await apiClient.post('/ai/job-match/analyze', {
        cv_id: cvId,
        job_description: jobDescription,
        detailed: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  },
  
  // Check AI service health status
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return { 
        success: true, 
        data: {
          status: response.data.status,
          openai_connection: response.data.openai_connection
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiError(error)
      };
    }
  }
};

export default aiService; 