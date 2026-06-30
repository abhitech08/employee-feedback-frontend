import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import DashboardLayout from '../layouts/DashboardLayout';
import { feedbackService } from '../services/feedbackService';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { departmentService } from '../services/departmentService';

const toId = (value) => String(value ?? '');

const includesText = (value, term) => String(value ?? '').toLowerCase().includes(term);

const SearchableSelect = ({ id, label, value, options, placeholder, searchPlaceholder, emptyMessage, error, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedOption = options.find((option) => toId(option.value) === toId(value));
  const searchTerm = search.trim().toLowerCase();
  const visibleOptions = searchTerm
    ? options.filter((option) => includesText(option.searchText || option.label, searchTerm))
    : options;

  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedOption?.label || '');
    }
  }, [isOpen, selectedOption?.label]);

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-gray-700 font-semibold mb-2">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="text"
          className="input-field pr-20"
          value={search}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          autoComplete="off"
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
        />
        {value && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-900"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            Clear
          </button>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${toId(option.value) === toId(value) ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700'}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(toId(option.value));
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">{searchTerm ? searchPlaceholder : emptyMessage}</div>
          )}
        </div>
      )}
      {error && <span className="text-red-500 text-sm">{error.message}</span>}
    </div>
  );
};

const FeedbackPage = () => {
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues: { is_anonymous: false } });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCompanyId = watch('company_id');
  const selectedDepartmentId = watch('department_id');
  const selectedEmployeeId = watch('given_to');

  const { data: companies = [] } = useQuery({
    queryKey: ['feedback-companies'],
    queryFn: companyService.getAllCompanies
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['feedback-departments', 'all'],
    queryFn: () => departmentService.getAllDepartments(null)
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employee-lookup', 'all'],
    queryFn: () => feedbackService.getEmployeeLookup(),
    enabled: Boolean(user)
  });

  const submitMutation = useMutation({
    mutationFn: (data) => feedbackService.createFeedback(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setMessage(response.message || 'Feedback submitted successfully');
    }
  });

  const activeEmployees = useMemo(() => (
    employees.filter((employee) => toId(employee.id) !== toId(user?.id))
  ), [employees, user?.id]);

  const visibleDepartments = useMemo(() => (
    selectedCompanyId
      ? departments.filter((department) => toId(department.company_id) === toId(selectedCompanyId))
      : departments
  ), [departments, selectedCompanyId]);

  const visibleEmployees = useMemo(() => (
    activeEmployees.filter((employee) => {
      const matchesCompany = !selectedCompanyId || toId(employee.company_id) === toId(selectedCompanyId);
      const matchesDepartment = !selectedDepartmentId || toId(employee.department_id) === toId(selectedDepartmentId);
      return matchesCompany && matchesDepartment;
    })
  ), [activeEmployees, selectedCompanyId, selectedDepartmentId]);

  const companyOptions = useMemo(() => (
    companies.map((company) => ({
      value: company.id,
      label: company.company_name,
      searchText: company.company_name
    }))
  ), [companies]);

  const departmentOptions = useMemo(() => (
    visibleDepartments.map((department) => ({
      value: department.id,
      label: `${department.department_name} - ${department.company_name}`,
      searchText: `${department.department_name} ${department.company_name}`
    }))
  ), [visibleDepartments]);

  const employeeOptions = useMemo(() => (
    visibleEmployees.map((employee) => ({
      value: employee.id,
      label: `${employee.name} | ${employee.department_name} | ${employee.company_name}`,
      searchText: `${employee.name} ${employee.employee_id} ${employee.department_name} ${employee.company_name}`
    }))
  ), [visibleEmployees]);

  const setFormValue = (field, value) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  };

  const handleCompanyChange = (companyId) => {
    const currentDepartment = departments.find((department) => toId(department.id) === toId(selectedDepartmentId));
    const currentEmployee = activeEmployees.find((employee) => toId(employee.id) === toId(selectedEmployeeId));
    const nextDepartmentId = companyId && currentDepartment?.company_id && toId(currentDepartment.company_id) === toId(companyId)
      ? toId(currentDepartment.id)
      : '';
    const employeeStillMatches = currentEmployee
      && (!companyId || toId(currentEmployee.company_id) === toId(companyId))
      && (!nextDepartmentId || toId(currentEmployee.department_id) === toId(nextDepartmentId));

    setFormValue('company_id', companyId);
    setFormValue('department_id', nextDepartmentId);
    setFormValue('given_to', employeeStillMatches ? toId(currentEmployee.id) : '');
  };

  const handleDepartmentChange = (departmentId) => {
    const department = departments.find((item) => toId(item.id) === toId(departmentId));
    const currentEmployee = activeEmployees.find((employee) => toId(employee.id) === toId(selectedEmployeeId));
    const companyId = department ? toId(department.company_id) : toId(selectedCompanyId);
    const employeeStillMatches = currentEmployee
      && (!departmentId || toId(currentEmployee.department_id) === toId(departmentId))
      && (!companyId || toId(currentEmployee.company_id) === toId(companyId));

    setFormValue('department_id', departmentId);
    if (department) {
      setFormValue('company_id', companyId);
    }
    setFormValue('given_to', employeeStillMatches ? toId(currentEmployee.id) : '');
  };

  const handleEmployeeChange = (employeeId) => {
    const employee = activeEmployees.find((item) => toId(item.id) === toId(employeeId));

    setFormValue('given_to', employeeId);
    if (employee) {
      setFormValue('company_id', toId(employee.company_id));
      setFormValue('department_id', toId(employee.department_id));
    }
  };

  const onSubmit = async (data) => {
    setMessage('');
    setErrorMessage('');
    try {
      const recipient = activeEmployees.find((employee) => toId(employee.id) === toId(data.given_to));
      await submitMutation.mutateAsync({
        ...data,
        given_to: Number(data.given_to),
        communication: Number(data.communication),
        teamwork: Number(data.teamwork),
        respect: Number(data.respect),
        responsibility: Number(data.responsibility),
        leadership: Number(data.leadership),
        company_id: Number(recipient?.company_id || data.company_id),
        department_id: Number(recipient?.department_id || data.department_id),
        is_anonymous: Boolean(data.is_anonymous)
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Unable to submit feedback');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-panel max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">Submit Feedback</h1>
          <p className="page-subtitle">Choose a recipient and rate five core dimensions.</p>
        </div>

        {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{message}</div>}
        {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{errorMessage}</div>}

        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)}>

          <input type="hidden" {...register('company_id', { required: 'Company is required' })} />
          <input type="hidden" {...register('department_id', { required: 'Department is required' })} />
          <input type="hidden" {...register('given_to', { required: 'Recipient is required' })} />

          <SearchableSelect
            id="feedback-company"
            label="Company"
            value={selectedCompanyId}
            options={companyOptions}
            placeholder="Select company"
            searchPlaceholder="No companies match your search."
            emptyMessage="No companies available."
            error={errors.company_id}
            onChange={handleCompanyChange}
          />

          <SearchableSelect
            id="feedback-department"
            label="Department"
            value={selectedDepartmentId}
            options={departmentOptions}
            placeholder="Select department"
            searchPlaceholder="No departments match your search."
            emptyMessage="No departments available."
            error={errors.department_id}
            onChange={handleDepartmentChange}
          />
          <div className="md:col-span-2">
            <SearchableSelect
              id="feedback-employee"
              label="Employee"
              value={selectedEmployeeId}
              options={employeeOptions}
              placeholder="Select employee"
              searchPlaceholder="No employees match your search."
              emptyMessage="No active recipients available."
              error={errors.given_to}
              onChange={handleEmployeeChange}
            />
            {visibleEmployees.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">No active recipients found for this selection.</p>
            )}
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['communication', 'teamwork', 'respect', 'responsibility', 'leadership'].map((field) => (
              <div key={field}>
                <label className="block text-gray-700 font-semibold mb-2 capitalize">{field}</label>
                <select className="input-field" {...register(field, { required: true })}>
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">Comment</label>
            <textarea className="input-field min-h-[120px]" {...register('comment')} />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" {...register('is_anonymous')} className="h-4 w-4" />
              <span className="text-gray-700 font-semibold">Submit anonymously</span>
            </label>
          </div>

          <div className="md:col-span-2 flex gap-4">
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitMutation.isPending}>Submit Feedback</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default FeedbackPage;
