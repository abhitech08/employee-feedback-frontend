import apiClient from './api';

export const feedbackService = {
  getEmployeeLookup: async (params = {}) => {
    const response = await apiClient.get('/employees/lookup', { params });
    return response.data.data;
  },

  createFeedback: async (data) => {
    const response = await apiClient.post('/feedback', data);
    return response.data;
  },

  getMyFeedback: async () => {
    const response = await apiClient.get('/feedback/my');
    return response.data.data;
  },

  getFeedbackHistory: async () => {
    const response = await apiClient.get('/feedback/history');
    return response.data.data;
  }
};