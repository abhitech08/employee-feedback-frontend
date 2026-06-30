import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/departmentService';
import { companyService } from '../services/companyService';
import DashboardLayout from '../layouts/DashboardLayout';
import DepartmentModal from '../components/DepartmentModal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { useToasts } from '../components/ToastProvider';
import { authService } from '../services/authService';

const DepartmentManagementPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const { pushToast } = useToasts();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: companyService.getAllCompanies,
    enabled: user?.role === 'super_admin'
  });

  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['departments', selectedCompany],
    queryFn: () => departmentService.getAllDepartments(user?.role === 'super_admin' && !selectedCompany ? null : (selectedCompany || user?.company_id))
  });

  const modalCompanies = user?.role === 'super_admin'
    ? companies
    : [{ id: user?.company_id, company_name: `Assigned company #${user?.company_id}` }];

  const createMutation = useMutation({
    mutationFn: (data) => departmentService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowModal(false);
      pushToast({ type: 'success', title: 'Department saved', message: 'Department created successfully.' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Save failed', message: error.response?.data?.error || 'Unable to create department.' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => departmentService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingDepartment(null);
      pushToast({ type: 'success', title: 'Department saved', message: 'Department updated successfully.' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Save failed', message: error.response?.data?.error || 'Unable to update department.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeleteConfirm(null);
      pushToast({ type: 'success', title: 'Department deleted', message: 'Department deleted successfully.' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Delete failed', message: error.response?.data?.error || 'Unable to delete department.' });
    }
  });

  const handleAddDepartment = async (data) => {
    try {
      await createMutation.mutateAsync({
        company_id: Number(data.company_id || selectedCompany || user?.company_id),
        department_name: data.department_name,
        status: data.status || 'active'
      });
    } catch {
      // Mutation onError displays the user-facing failure.
    }
  };

  const handleUpdateDepartment = async (id, data) => {
    try {
      await updateMutation.mutateAsync({ id, data });
    } catch {
      // Mutation onError displays the user-facing failure.
    }
  };

  return (
    <DashboardLayout>
      <div className="page-panel">
        <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <h1 className="page-title">Department Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary w-full sm:w-auto"
          >
            + Add Department
          </button>
        </div>

        {user?.role === 'super_admin' && (
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Select Company</label>
            <select
              value={selectedCompany || ''}
              onChange={(e) => setSelectedCompany(e.target.value || null)}
              className="input-field"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            Error loading departments
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">Loading departments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left">Department Name</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id} className="border-b hover:bg-gray-50">
                    <td data-label="Department Name" className="px-4 py-2">{department.department_name}</td>
                    <td data-label="Company" className="px-4 py-2">{department.company_name}</td>
                    <td data-label="Status" className="px-4 py-2"><StatusBadge value={department.status} /></td>
                    <td data-label="Created At" className="px-4 py-2">{new Date(department.created_at).toLocaleDateString()}</td>
                    <td data-label="Actions" className="px-4 py-2 responsive-actions">
                      <button
                        onClick={() => setEditingDepartment(department)}
                        className="table-action"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(department.id)}
                        className="table-action text-red-700 dark:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <DepartmentModal
            companies={modalCompanies}
            defaultCompanyId={user?.role === 'super_admin' ? (selectedCompany || '') : (user?.company_id || '')}
            onClose={() => setShowModal(false)}
            onSubmit={handleAddDepartment}
            loading={createMutation.isPending}
          />
        )}

        {editingDepartment && (
          <DepartmentModal
            department={editingDepartment}
            companies={modalCompanies}
            onClose={() => setEditingDepartment(null)}
            onSubmit={(data) => handleUpdateDepartment(editingDepartment.id, data)}
            loading={updateMutation.isPending}
          />
        )}

        <ConfirmDialog
          open={Boolean(deleteConfirm)}
          title="Confirm Delete"
          description="Are you sure you want to delete this department?"
          confirmText="Delete"
          danger
          loading={deleteMutation.isPending}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm)}
        />
      </div>
    </DashboardLayout>
  );
};

export default DepartmentManagementPage;
