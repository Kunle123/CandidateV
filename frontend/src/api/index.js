import apiClient from './apiClient';
import { apiService } from './apiClient';
import userService from './userService';
import cvService from './cvService';
import exportService from './exportService';
import aiService from './aiService';
import paymentService from './paymentService';
import * as utils from './utils';

// Export all API services
export {
  apiClient,
  apiService,
  userService,
  cvService,
  exportService,
  aiService,
  paymentService,
  utils
};

// Export default as an object with all services
export default {
  apiClient,
  apiService,
  user: userService,
  cv: cvService,
  export: exportService,
  ai: aiService,
  payment: paymentService
}; 