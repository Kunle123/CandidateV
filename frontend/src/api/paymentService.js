import apiClient from './apiClient';

// Payment service for handling subscriptions and payments
const paymentService = {
  // Get available subscription plans
  async getPlans() {
    try {
      const response = await apiClient.get('/payments/plans');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch subscription plans'
      };
    }
  },

  // Get current user subscription
  async getCurrentSubscription() {
    try {
      const response = await apiClient.get('/payments/subscription');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch subscription'
      };
    }
  },

  // Create checkout session
  async createCheckoutSession(planId) {
    try {
      const response = await apiClient.post('/payments/checkout', { plan_id: planId });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to create checkout session'
      };
    }
  },

  // Handle subscription update
  async updateSubscription(subscriptionId, planId) {
    try {
      const response = await apiClient.patch(`/payments/subscriptions/${subscriptionId}`, {
        plan_id: planId
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update subscription'
      };
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await apiClient.delete(`/payments/subscriptions/${subscriptionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to cancel subscription'
      };
    }
  },

  // Get payment history
  async getPaymentHistory() {
    try {
      const response = await apiClient.get('/payments/history');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch payment history'
      };
    }
  },

  // Get invoice by ID
  async getInvoice(invoiceId) {
    try {
      const response = await apiClient.get(`/payments/invoices/${invoiceId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to fetch invoice'
      };
    }
  }
};

export default paymentService; 