import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { reportService } from '../services/reportService';
import { authService } from '../services/authService';

const formatLabel = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const ratingCategoryData = (rows) => ['communication', 'teamwork', 'respect', 'responsibility', 'leadership'].map((key) => {
  const values = rows.map((row) => Number(row[key] || 0)).filter(Boolean);
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return { name: formatLabel(key), average: Number(average.toFixed(2)) };
});

const ReportsPage = () => {
  const [reportType, setReportType] = useState('employee');
  const [companyId, setCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const user = authService.getUser();
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin && user?.company_id) {
      setCompanyId(String(user.company_id));
      if (reportType === 'company') setReportType('employee');
    }
  }, [isSuperAdmin, reportType, user?.company_id]);

  const employeeFeedbackQuery = useQuery({ queryKey: ['report-employee-feedback', companyId, departmentId, employeeId, startDate, endDate], queryFn: () => reportService.getEmployeeFeedbackReport({ company_id: companyId, department_id: departmentId, employee_id: employeeId, start_date: startDate, end_date: endDate }), enabled: reportType === 'employee' });
  const companyQuery = useQuery({ queryKey: ['report-company'], queryFn: reportService.getCompanyReport, enabled: reportType === 'company' });
  const departmentQuery = useQuery({ queryKey: ['report-department'], queryFn: reportService.getDepartmentReport, enabled: reportType === 'department' });

  const data = reportType === 'employee' ? employeeFeedbackQuery.data || [] : reportType === 'company' ? companyQuery.data || [] : departmentQuery.data || [];

  const chartData = useMemo(() => {
    if (reportType === 'employee') {
      return {
        primary: data.map((row) => ({
          name: row.given_to_name || `#${row.given_to}`,
          score: Number(row.overall_rating || 0)
        })).slice(0, 12),
        secondary: ratingCategoryData(data)
      };
    }

    if (reportType === 'company') {
      return {
        primary: data.map((row) => ({
          name: row.company_name,
          employees: Number(row.employee_count || 0),
          feedback: Number(row.feedback_count || 0),
          score: Number(row.company_score || 0)
        }))
      };
    }

    return {
      primary: data.map((row) => ({
        name: row.department_name,
        employees: Number(row.employee_count || 0),
        feedback: Number(row.feedback_count || 0),
        score: Number(row.department_score || 0)
      }))
    };
  }, [data, reportType]);

  const totals = useMemo(() => {
    if (!data.length) return [];
    if (reportType === 'company') {
      return [
        { label: 'Companies', value: data.length },
        { label: 'Employees', value: data.reduce((sum, row) => sum + Number(row.employee_count || 0), 0) },
        { label: 'Feedback', value: data.reduce((sum, row) => sum + Number(row.feedback_count || 0), 0) }
      ];
    }
    if (reportType === 'department') {
      return [
        { label: 'Departments', value: data.length },
        { label: 'Employees', value: data.reduce((sum, row) => sum + Number(row.employee_count || 0), 0) },
        { label: 'Feedback', value: data.reduce((sum, row) => sum + Number(row.feedback_count || 0), 0) }
      ];
    }
    if (reportType === 'employee') {
      const average = data.length ? data.reduce((sum, row) => sum + Number(row.overall_rating || 0), 0) / data.length : 0;
      return [
        { label: 'Feedback Entries', value: data.length },
        { label: 'Average Rating', value: average.toFixed(2) }
      ];
    }
    return [];
  }, [data, reportType]);

  const downloadExcel = async () => {
    let endpoint = '/reports/employee-feedback';
    const params = { company_id: companyId, department_id: departmentId, employee_id: employeeId, start_date: startDate, end_date: endDate };
    if (reportType === 'company') {
      endpoint = '/reports/company';
    } else if (reportType === 'department') {
      endpoint = '/reports/department';
    }

    const blob = await reportService.downloadReport(endpoint, params);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="page-panel space-y-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Dedicated reporting for feedback, company, and department analytics.</p>
          </div>
          <button className="btn-secondary w-full sm:w-auto" onClick={downloadExcel}>Export Excel</button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select className="input-field" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="employee">Feedback-Rating App Report</option>
            {isSuperAdmin && <option value="company">Company Report</option>}
            <option value="department">Department Report</option>
          </select>
          <input className="input-field" placeholder="Company ID" value={companyId} onChange={(e) => setCompanyId(e.target.value)} readOnly={!isSuperAdmin} />
          <input className="input-field" placeholder="Department ID" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} />
          {reportType === 'employee' && <input className="input-field" placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />}
          <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {totals.map((item) => (
            <div key={item.label} className="card bg-gray-50">
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportType === 'employee' && (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Feedback Scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Average By Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.secondary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {reportType === 'company' && (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Company Activity</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="employees" fill="#2563eb" />
                    <Bar dataKey="feedback" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Company Scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {reportType === 'department' && (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Department Activity</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="employees" fill="#2563eb" />
                    <Bar dataKey="feedback" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Department Scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full responsive-table">
            <thead>
              <tr className="bg-gray-100 border-b">
                {data?.[0] ? Object.keys(data[0]).map((key) => <th key={key} className="px-4 py-2 text-left">{key}</th>) : <th className="px-4 py-2 text-left">No data</th>}
              </tr>
            </thead>
            <tbody>
              {data?.length ? data.map((row, index) => <tr key={index} className="border-b">{Object.entries(row).map(([key, value]) => <td key={key} data-label={key} className="px-4 py-2">{String(value ?? '')}</td>)}</tr>) : <tr><td data-label="Status" className="px-4 py-6 text-center text-gray-500" colSpan={12}>No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
