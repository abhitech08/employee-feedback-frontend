import apiClient from './api';

export const companyService = {
  getAllCompanies: async () => {
    const response = await apiClient.get('/companies');
    return response.data.data;
  },

  getCompanyById: async (id) => {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data.data;
  },

  createCompany: async (data) => {
    const response = await apiClient.post('/companies', data);
    return response.data.data;
  },

  updateCompany: async (id, data) => {
    const response = await apiClient.put(`/companies/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id) => {
    const response = await apiClient.delete(`/companies/${id}`);
    return response.data;
  },

  updateCompanyStatus: async (id, status) => {
    const response = await apiClient.patch(`/companies/${id}/status`, { status });
    return response.data;
  }
};
