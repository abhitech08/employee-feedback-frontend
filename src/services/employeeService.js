import apiClient from './api';

export const employeeService = {
  getAllEmployees: async (params = {}) => {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data;
  },

  updateEmployeeStatus: async (id, status) => {
    const response = await apiClient.patch(`/employees/${id}/status`, { status });
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  importEmployees: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/employees/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  downloadImportTemplate: async () => {
    const response = await apiClient.get('/employees/import-template', { responseType: 'blob' });
    return response.data;
  },

  exportEmployees: async (params = {}) => {
    const response = await apiClient.get('/employees/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
