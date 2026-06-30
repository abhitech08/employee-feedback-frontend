import apiClient from './api';

export const dashboardService = {
  getDashboard: async (role) => {
    const endpoint = role === 'super_admin' ? '/dashboard/admin' : role === 'company_admin' ? '/dashboard/company' : '/dashboard/employee';
    const response = await apiClient.get(endpoint);
    return response.data;
  }
};