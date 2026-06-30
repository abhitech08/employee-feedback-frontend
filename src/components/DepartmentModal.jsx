import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const DepartmentModal = ({ department, companies = [], defaultCompanyId = '', onClose, onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      status: 'active',
      company_id: defaultCompanyId
    }
  });

  useEffect(() => {
    if (department) {
      setValue('department_name', department.department_name);
      setValue('status', department.status || 'active');
      setValue('company_id', department.company_id);
    }
  }, [department, setValue]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-semibold mb-4">
          {department ? 'Edit Department' : 'Add New Department'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Department Name</label>
            <input
              type="text"
              {...register('department_name', { required: 'Department name is required' })}
              className="input-field"
              placeholder="Enter department name"
            />
            {errors.department_name && (
              <span className="text-red-500 text-sm">{errors.department_name.message}</span>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Company</label>
            <select
              {...register('company_id', { required: 'Company is required' })}
              className="input-field"
            >
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.company_name}</option>
              ))}
            </select>
            {errors.company_id && (
              <span className="text-red-500 text-sm">{errors.company_id.message}</span>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Status</label>
            <select
              {...register('status')}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;
