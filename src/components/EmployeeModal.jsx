import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const passwordRules = {
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters'
  },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must include uppercase, lowercase, number, and special character'
  }
};

const EmployeeModal = ({ employee, companies = [], departments = [], error = '', onClose, onSubmit, loading, canManageSuperAdmins = false }) => {
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: { role: 'employee', status: 'active' }
  });

  const selectedCompanyId = watch('company_id');

  useEffect(() => {
    if (employee) {
      Object.entries(employee).forEach(([key, value]) => setValue(key, value));
    }
  }, [employee, setValue]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialogEl = document.getElementById('employee-modal');

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusable = dialogEl?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.focus?.();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();

      if (e.key === 'Tab') {
        const focusTargets = Array.from(
          dialogEl?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) || []
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusTargets.length === 0) return;

        const first = focusTargets[0];
        const last = focusTargets[focusTargets.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const availableDepartments = departments.filter((department) => String(department.company_id) === String(selectedCompanyId));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-modal-title"
    >
      <div
        id="employee-modal"
        className="bg-white rounded-lg p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
        <h2 id="employee-modal-title" className="text-xl font-semibold mb-4">{employee ? 'Edit Employee' : 'Add Employee'}</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)}>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Employee ID</label>
            <input className="input-field" {...register('employee_id', { required: 'Employee ID is required' })} />
            {errors.employee_id && <span className="text-red-500 text-sm">{errors.employee_id.message}</span>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Name</label>
            <input className="input-field" {...register('name', { required: 'Name is required' })} />
            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input type="email" className="input-field" {...register('email', { required: 'Email is required' })} />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Password {employee ? '(optional)' : ''}</label>
            <input
              type="password"
              className="input-field"
              {...register('password', {
                required: employee ? false : 'Password is required',
                validate: (value) => {
                  if (employee && !value) return true;
                  if (value.length < passwordRules.minLength.value) return passwordRules.minLength.message;
                  if (!passwordRules.pattern.value.test(value)) return passwordRules.pattern.message;
                  return true;
                }
              })}
            />
            {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Mobile</label>
            <input className="input-field" {...register('mobile')} />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Designation</label>
            <input className="input-field" {...register('designation')} />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Company</label>
            <select
              className="input-field"
              {...register('company_id', {
                required: 'Company is required',
                onChange: () => setValue('department_id', '')
              })}
            >
              <option value="">Select company</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.company_name}</option>)}
            </select>
            {errors.company_id && <span className="text-red-500 text-sm">{errors.company_id.message}</span>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Department</label>
            <select className="input-field" disabled={!selectedCompanyId} {...register('department_id', { required: 'Department is required' })}>
              <option value="">Select department</option>
              {availableDepartments.map((department) => <option key={department.id} value={department.id}>{department.department_name}</option>)}
            </select>
            {errors.department_id && <span className="text-red-500 text-sm">{errors.department_id.message}</span>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Role</label>
            <select className="input-field" {...register('role')}>
              <option value="employee">Employee</option>
              <option value="company_admin">Company Admin</option>
              {canManageSuperAdmins && <option value="super_admin">Super Admin</option>}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Status</label>
            <select className="input-field" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {error && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="md:col-span-2 flex flex-col gap-3 mt-2 sm:flex-row sm:gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
