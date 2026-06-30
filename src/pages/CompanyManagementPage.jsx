import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import CompanyModal from '../components/CompanyModal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { useToasts } from '../components/ToastProvider';
import { companyService } from '../services/companyService';

const CompanyManagementPage = () => {
  const [showModal, setShowModal] = useState(false);

  const [editingCompany, setEditingCompany] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { pushToast } = useToasts();

  const { data: companies = [], isLoading, error } = useQuery({

    queryKey: ['companies'],
    queryFn: companyService.getAllCompanies
  });

  const createMutation = useMutation({
    mutationFn: (data) => companyService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowModal(false);
      pushToast({ type: 'success', title: 'Company saved', message: 'Company created successfully.' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Save failed', message: error.response?.data?.error || 'Unable to create company.' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => companyService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setEditingCompany(null);
      pushToast({ type: 'success', title: 'Company saved', message: 'Company updated successfully.' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Save failed', message: error.response?.data?.error || 'Unable to update company.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDeleteConfirm(null);
      pushToast({ type: 'success', title: 'Company deleted', message: 'Company deleted successfully.' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Delete failed', message: error.response?.data?.error || 'Unable to delete company.' });
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => companyService.updateCompanyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      pushToast({ type: 'success', title: 'Status updated', message: 'Company status updated.' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Status update failed', message: error.response?.data?.error || 'Unable to update company status.' });
    }
  });


  const handleAddCompany = async (data) => {
    try {
      await createMutation.mutateAsync(data);
    } catch {
      // Mutation onError displays the user-facing failure.
    }
  };

  const handleUpdateCompany = async (id, data) => {
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
          <h1 className="page-title">Company Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary w-full sm:w-auto"
          >
            + Add Company
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            Error loading companies
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">Loading companies...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left">Company Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b hover:bg-gray-50">
                    <td data-label="Company Name" className="px-4 py-2">{company.company_name}</td>
                    <td data-label="Status" className="px-4 py-2"><StatusBadge value={company.status} /></td>
                    <td data-label="Created At" className="px-4 py-2">{new Date(company.created_at).toLocaleDateString()}</td>
                    <td data-label="Actions" className="px-4 py-2 responsive-actions">
                      <button
                        onClick={() => setEditingCompany(company)}
                        className="table-action"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({
                          id: company.id,
                          status: company.status === 'active' ? 'inactive' : 'active'
                        })}
                        className="table-action"
                      >
                        {company.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(company.id)}
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
          <CompanyModal
            onClose={() => setShowModal(false)}
            onSubmit={handleAddCompany}
            loading={createMutation.isPending}
          />
        )}

        {editingCompany && (
          <CompanyModal
            company={editingCompany}
            onClose={() => setEditingCompany(null)}
            onSubmit={(data) => handleUpdateCompany(editingCompany.id, data)}
            loading={updateMutation.isPending}
          />
        )}

        <ConfirmDialog
          open={Boolean(deleteConfirm)}
          title="Confirm Delete"
          description="Are you sure you want to delete this company?"
          confirmText="Delete"
          cancelText="Cancel"
          danger
          loading={deleteMutation.isPending}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm)}
        />
      </div>

    </DashboardLayout>
  );
};

export default CompanyManagementPage;
