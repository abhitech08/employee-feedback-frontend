import apiClient from './api';

export const userService = {
  getAllUsers: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  createUser: async (data) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await apiClient.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  resetPassword: async (id, newPassword) => {
    const response = await apiClient.post(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};