import apiClient from './api';

export const departmentService = {
  getAllDepartments: async (company_id = null) => {
    const params = company_id ? { company_id } : {};
    const response = await apiClient.get('/departments', { params });
    return response.data.data;
  },

  getDepartmentById: async (id) => {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data.data;
  },

  createDepartment: async (data) => {
    const response = await apiClient.post('/departments', data);
    return response.data.data;
  },

  updateDepartment: async (id, data) => {
    const response = await apiClient.put(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  }
};
