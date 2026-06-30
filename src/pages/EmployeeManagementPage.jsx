import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import EmployeeModal from '../components/EmployeeModal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { useToasts } from '../components/ToastProvider';
import { SkeletonBlock } from '../components/Skeleton';
import { employeeService } from '../services/employeeService';
import { companyService } from '../services/companyService';
import { departmentService } from '../services/departmentService';
import { authService } from '../services/authService';


const EmployeeManagementPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState('');

  const [showImport, setShowImport] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [notice, setNotice] = useState(null);
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const isSuperAdmin = user?.role === 'super_admin';

  const { pushToast } = useToasts();


  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: companyService.getAllCompanies,
    enabled: user?.role === 'super_admin'
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', isSuperAdmin ? 'all' : user?.company_id],
    queryFn: () => departmentService.getAllDepartments(isSuperAdmin ? null : user?.company_id),
    enabled: isSuperAdmin || Boolean(user?.company_id)
  });

  const employeesQuery = useQuery({
    queryKey: ['employees', { search, companyId, departmentId, status, page }],
    queryFn: () => employeeService.getAllEmployees({ search, company_id: companyId, department_id: departmentId, status, page, limit: 10 })
  });

  const createMutation = useMutation({
    mutationFn: (data) => employeeService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      pushToast({ type: 'success', title: 'Employee saved', message: 'Employee created successfully.' });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingEmployee(null);
      setShowModal(false);
      pushToast({ type: 'success', title: 'Employee saved', message: 'Employee updated successfully.' });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteConfirm(null);
      pushToast({ type: 'success', title: 'Employee deleted', message: 'Employee deleted.' });
    }
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => employeeService.updateEmployeeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      pushToast({ type: 'success', title: 'Status updated', message: 'Employee status updated.' });
    }
  });

  const importMutation = useMutation({
    mutationFn: (uploadFile) => employeeService.importEmployees(uploadFile),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setFile(null);
      setFileInputKey((key) => key + 1);
      const imported = response.data?.importedCount || 0;
      const errors = response.data?.errors || [];
      setNotice({
        type: errors.length ? 'warning' : 'success',
        text: `${imported} employee${imported === 1 ? '' : 's'} imported.`,
        errors
      });
      if (errors.length === 0) {
        pushToast({
          type: 'success',
          title: 'Import completed',
          message: `${imported} employee${imported === 1 ? '' : 's'} imported.`
        });
      } else {
        pushToast({
          type: 'warning',
          title: 'Import completed with issues',
          message: `Imported ${imported} records. Review row errors.`
        });
      }
    },
    onError: (error) => {
      setNotice({ type: 'error', text: error.response?.data?.error || 'Import failed.' });
      pushToast({ type: 'error', title: 'Import failed', message: error.response?.data?.error || 'Import failed.' });
    }
  });
  const templateMutation = useMutation({
    mutationFn: employeeService.downloadImportTemplate,
    onSuccess: (blob) => downloadBlob(blob, 'employee-import-template.xlsx'),
    onError: () => {
      setNotice({ type: 'error', text: 'Unable to download the template.' });
      pushToast({ type: 'error', title: 'Template download failed', message: 'Unable to download the template.' });
    }
  });

  const exportMutation = useMutation({
    mutationFn: (filters) => employeeService.exportEmployees(filters),
    onSuccess: (blob) => {
      downloadBlob(blob, 'employees.xlsx');
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'Export failed', message: error.response?.data?.error || 'Unable to export employees.' });
    }
  });

  const data = employeesQuery.data?.data || [];
  const pagination = employeesQuery.data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const visibleDepartments = companyId
    ? departments.filter((department) => String(department.company_id) === String(companyId))
    : departments;
  const modalCompanies = useMemo(() => {
    if (isSuperAdmin) return companies;
    const department = departments[0];
    return department ? [{ id: user.company_id, company_name: department.company_name }] : [];
  }, [companies, departments, isSuperAdmin, user?.company_id]);

  function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  const formatImportError = (err) => {
    if (!err || typeof err !== 'object') return String(err);
    return err.row ? `Row ${err.row}: ${err.message}` : err.message || JSON.stringify(err);
  };

  const handleSubmitEmployee = async (formData) => {
    setFormError('');
    try {
      const payload = { ...formData, company_id: Number(formData.company_id), department_id: Number(formData.department_id) };
      if (editingEmployee) {
        if (!payload.password) delete payload.password;
        await updateMutation.mutateAsync({ id: editingEmployee.id, data: payload });
        return;
      }
      await createMutation.mutateAsync(payload);
    } catch (error) {
      setFormError(error.response?.data?.error || 'Unable to save employee');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-panel space-y-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Employee Management</h1>
            <p className="page-subtitle">Manage your workforce, access, and bulk onboarding.</p>
          </div>
          <button onClick={() => { setEditingEmployee(null); setFormError(''); setShowModal(true); }} className="btn-primary w-full sm:w-auto">+ Add Employee</button>
        </div>



        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="metric-card"><span>Total employees</span><strong>{pagination.total}</strong></div>
          <div className="metric-card"><span>Shown on page</span><strong>{data.length}</strong></div>
          <div className="metric-card"><span>Active shown</span><strong>{data.filter((item) => item.status === 'active').length}</strong></div>
          <div className="metric-card"><span>Departments shown</span><strong>{new Set(data.map((item) => item.department_id)).size}</strong></div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="input-field" placeholder="Search name, employee ID, email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          {isSuperAdmin && (
            <select className="input-field" value={companyId} onChange={(e) => { setCompanyId(e.target.value); setDepartmentId(''); setPage(1); }}>
              <option value="">All Companies</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.company_name}</option>)}
            </select>
          )}
          <select className="input-field" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {visibleDepartments.map((department) => <option key={department.id} value={department.id}>{department.department_name}</option>)}
          </select>
          <select className="input-field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn-neutral" onClick={() => { setSearch(''); setCompanyId(''); setDepartmentId(''); setStatus(''); setPage(1); }}>Reset filters</button>
        </div>

        <div className="flex flex-wrap gap-3 border-y border-slate-200 py-4">
          <button className="btn-secondary" onClick={() => setShowImport((value) => !value)}>{showImport ? 'Close import' : 'Import employees'}</button>
          <button className="btn-neutral" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate({ search, company_id: companyId, department_id: departmentId, status })}>{exportMutation.isPending ? 'Preparing...' : 'Export current view'}</button>
        </div>

        {notice && (
          <div
            className={
              notice.type === 'warning'
                ? 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'
                : notice.type === 'error'
                  ? 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700'
                  : 'rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-emerald-700'
            }
            role="status"
            aria-live="polite"
          >
            <div className="font-semibold">{notice.type === 'warning' ? 'Import completed with issues' : notice.type === 'error' ? 'Import failed' : 'Import successful'}</div>
            <div className="text-sm mt-1">{notice.text}</div>
            {Array.isArray(notice.errors) && notice.errors.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold">View row errors ({notice.errors.length})</summary>
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 overflow-auto max-h-48">
                  <ul className="list-disc pl-5">
                    {notice.errors.slice(0, 50).map((err, idx) => (
                      <li key={idx}>{formatImportError(err)}</li>
                    ))}
                  </ul>
                  {notice.errors.length > 50 && <div className="mt-2 text-slate-500">Showing first 50 errors.</div>}
                </div>
              </details>
            )}
          </div>
        )}

        {showImport && (
          <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 sm:p-5" aria-labelledby="import-title">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 id="import-title" className="text-lg font-bold text-slate-950">Bulk employee import</h2>
                <p className="mt-1 text-sm text-slate-600">Download the template first. It contains an example, field rules, and valid company and department IDs.</p>
              </div>
              <button className="btn-neutral" disabled={templateMutation.isPending} onClick={() => templateMutation.mutate()}>{templateMutation.isPending ? 'Generating...' : 'Download sample template'}</button>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-5">
              {['employee_id', 'name', 'email', 'password', 'mobile', 'designation', 'company_id', 'department_id', 'role', 'status'].map((column) => <code key={column} className="rounded bg-white px-2 py-1.5 ring-1 ring-slate-200">{column}</code>)}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input key={fileInputKey} className="input-field bg-white sm:max-w-md" type="file" accept=".xlsx" onChange={(e) => { setFile(e.target.files?.[0] || null); setNotice(null); }} />
              <button className="btn-primary" disabled={!file || importMutation.isPending} onClick={() => file && importMutation.mutate(file)}>{importMutation.isPending ? 'Importing...' : 'Upload and import'}</button>
            </div>
          </section>
        )}

        {employeesQuery.isLoading ? (
          <div className="space-y-4" aria-label="Loading employees">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-24" />
              ))}
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <div className="p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1.1fr_1.4fr_1.6fr_1.2fr_1.2fr_0.8fr_0.8fr_0.9fr] gap-3 py-3 border-b border-slate-100 last:border-b-0">
                    <SkeletonBlock className="h-8" />
                    <SkeletonBlock className="h-8" />
                    <SkeletonBlock className="h-8" />
                    <SkeletonBlock className="h-8" />
                    <SkeletonBlock className="h-8" />
                    <SkeletonBlock className="h-8" />
                    <SkeletonBlock className="h-8" />
                    <SkeletonBlock className="h-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : employeesQuery.isError ? (

          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">Unable to load employees. <button className="font-semibold underline" onClick={() => employeesQuery.refetch()}>Try again</button></div>
        ) : data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center"><h2 className="font-semibold text-slate-900">No employees found</h2><p className="mt-1 text-sm text-slate-500">Adjust the filters or add your first employee.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left">Employee ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Department</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td data-label="Employee ID" className="px-4 py-2">{employee.employee_id}</td>
                    <td data-label="Name" className="px-4 py-2">{employee.name}</td>
                    <td data-label="Email" className="px-4 py-2">{employee.email}</td>
                    <td data-label="Company" className="px-4 py-2">{employee.company_name}</td>
                    <td data-label="Department" className="px-4 py-2">{employee.department_name}</td>
                    <td data-label="Role" className="px-4 py-2">{employee.role}</td>
                    <td data-label="Status" className="px-4 py-2"><StatusBadge value={employee.status} /></td>
                    <td data-label="Actions" className="px-4 py-2 responsive-actions">
                      <button className="table-action" onClick={() => { setEditingEmployee(employee); setFormError(''); setShowModal(true); }}>Edit</button>
                      <button className="table-action" onClick={() => statusMutation.mutate({ id: employee.id, status: employee.status === 'active' ? 'inactive' : 'active' })}>{employee.status === 'active' ? 'Disable' : 'Enable'}</button>
                      <button className="table-action text-red-700 dark:text-red-300" onClick={() => setDeleteConfirm(employee.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-gray-600">Page {pagination.page} of {Math.max(pagination.totalPages, 1)} · {pagination.total} records</span>
          <div className="flex gap-2">
            <button className="btn-neutral" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Prev</button>
            <button className="btn-neutral" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>

        {showModal && (
          <EmployeeModal employee={editingEmployee} companies={modalCompanies} departments={departments} error={formError} canManageSuperAdmins={isSuperAdmin} onClose={() => { setShowModal(false); setEditingEmployee(null); setFormError(''); }} onSubmit={handleSubmitEmployee} loading={createMutation.isPending || updateMutation.isPending} />
        )}

        <ConfirmDialog
          open={Boolean(deleteConfirm)}
          title="Confirm Delete"
          description="Delete this employee permanently?"
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

export default EmployeeManagementPage;

