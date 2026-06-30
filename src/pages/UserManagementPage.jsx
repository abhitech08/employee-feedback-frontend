import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import UserModal from '../components/UserModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PasswordResetDialog from '../components/PasswordResetDialog';
import StatusBadge from '../components/StatusBadge';
import { useToasts } from '../components/ToastProvider';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { departmentService } from '../services/departmentService';

const UserManagementPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [resetError, setResetError] = useState('');
  const { pushToast } = useToasts();

  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: companyService.getAllCompanies });
  const { data: departments = [] } = useQuery({ queryKey: ['departments', 'all'], queryFn: () => departmentService.getAllDepartments(null) });

  const { data: response, isLoading } = useQuery({
    queryKey: ['users', search, companyId, departmentId, role, status, page],
    queryFn: () => userService.getAllUsers({ search, company_id: companyId, department_id: departmentId, role, status, page, limit: 10 })
  });

  const users = response?.data || [];
  const pagination = response?.pagination || { page: 1, totalPages: 1 };
  const visibleDepartments = companyId
    ? departments.filter((department) => String(department.company_id) === String(companyId))
    : departments;

  const createMutation = useMutation({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      pushToast({ type: 'success', title: 'User saved', message: 'User created successfully.' });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      pushToast({ type: 'success', title: 'User saved', message: 'User updated successfully.' });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirm(null);
      pushToast({ type: 'success', title: 'User deleted', message: 'User deleted successfully.' });
    },
    onError: (error) => pushToast({ type: 'error', title: 'Delete failed', message: error.response?.data?.error || 'Unable to delete user.' })
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => userService.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      pushToast({ type: 'success', title: 'Status updated', message: 'User status updated.' });
    },
    onError: (error) => pushToast({ type: 'error', title: 'Status update failed', message: error.response?.data?.error || 'Unable to update status.' })
  });
  const resetMutation = useMutation({
    mutationFn: ({ id, password }) => userService.resetPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setResetTarget(null);
      setResetError('');
      pushToast({ type: 'success', title: 'Password reset', message: 'Password updated successfully.' });
    },
    onError: (error) => setResetError(error.response?.data?.error || 'Unable to reset password.')
  });

  const submitUser = async (data) => {
    setFormError('');
    try {
      const payload = { ...data, company_id: Number(data.company_id), department_id: Number(data.department_id) };
      if (editingUser) {
        if (!payload.password) delete payload.password;
        await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
        return;
      }
      await createMutation.mutateAsync(payload);
    } catch (error) {
      setFormError(error.response?.data?.error || 'Unable to save user');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-panel space-y-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Super Admin User Management</h1>
            <p className="page-subtitle">Manage company admins and all users with role control.</p>
          </div>
          <button className="btn-primary w-full sm:w-auto" onClick={() => { setEditingUser(null); setFormError(''); setShowModal(true); }}>+ Add User</button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input className="input-field" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="input-field" value={companyId} onChange={(e) => { setCompanyId(e.target.value); setDepartmentId(''); setPage(1); }}>
            <option value="">All Companies</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.company_name}</option>)}
          </select>
          <select className="input-field" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {visibleDepartments.map((department) => <option key={department.id} value={department.id}>{department.department_name}</option>)}
          </select>
          <select className="input-field" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="company_admin">Company Admin</option>
            <option value="employee">Employee</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select className="input-field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn-neutral" onClick={() => { setSearch(''); setCompanyId(''); setDepartmentId(''); setRole(''); setStatus(''); setPage(1); }}>Reset</button>
        </div>

        {isLoading ? <div className="py-8 text-center">Loading users...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead><tr className="bg-gray-100 border-b"><th className="px-4 py-2 text-left">Employee ID</th><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Email</th><th className="px-4 py-2 text-left">Company</th><th className="px-4 py-2 text-left">Department</th><th className="px-4 py-2 text-left">Role</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Actions</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td data-label="Employee ID" className="px-4 py-2">{user.employee_id}</td>
                    <td data-label="Name" className="px-4 py-2">{user.name}</td>
                    <td data-label="Email" className="px-4 py-2">{user.email}</td>
                    <td data-label="Company" className="px-4 py-2">{user.company_name}</td>
                    <td data-label="Department" className="px-4 py-2">{user.department_name}</td>
                    <td data-label="Role" className="px-4 py-2">{user.role}</td>
                    <td data-label="Status" className="px-4 py-2"><StatusBadge value={user.status} /></td>
                    <td data-label="Actions" className="px-4 py-2 responsive-actions">
                      <button className="table-action" onClick={() => { setEditingUser(user); setFormError(''); setShowModal(true); }}>Edit</button>
                      <button className="table-action" onClick={() => statusMutation.mutate({ id: user.id, status: user.status === 'active' ? 'inactive' : 'active' })}>{user.status === 'active' ? 'Disable' : 'Enable'}</button>
                      <button className="table-action" onClick={() => { setResetTarget(user); setResetError(''); }}>Reset Password</button>
                      <button className="table-action text-red-700 dark:text-red-300" onClick={() => setDeleteConfirm(user.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2"><button className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Prev</button><button className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div>
        </div>

        {showModal && <UserModal user={editingUser} companies={companies} departments={departments} error={formError} onClose={() => { setShowModal(false); setEditingUser(null); setFormError(''); }} onSubmit={submitUser} loading={createMutation.isPending || updateMutation.isPending} />}

        <ConfirmDialog
          open={Boolean(deleteConfirm)}
          title="Confirm Delete"
          description="Delete this user permanently?"
          confirmText="Delete"
          danger
          loading={deleteMutation.isPending}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm)}
        />
        <PasswordResetDialog
          open={Boolean(resetTarget)}
          user={resetTarget}
          loading={resetMutation.isPending}
          error={resetError}
          onClose={() => setResetTarget(null)}
          onConfirm={(password) => resetMutation.mutate({ id: resetTarget.id, password })}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserManagementPage;
