import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { authService } from '../services/authService';
import DashboardLayout from '../layouts/DashboardLayout';
import { dashboardService } from '../services/dashboardService';

const DashboardPage = () => {
  const user = authService.getUser();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => dashboardService.getDashboard(user?.role),
    enabled: Boolean(user?.role)
  });

  const summaryCards = data?.cards ? Object.entries(data.cards).map(([key, value]) => ({ key, value })) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="dashboard-banner">
          <div>
            <p className="text-sm font-semibold text-blue-100">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Good to see you, {user?.name?.split(' ')[0]}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">Monitor feedback health, spot trends, and keep your organization moving forward.</p>
          </div>
          <button className="bg-white text-blue-700 inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold shadow-sm hover:bg-blue-50" onClick={() => navigate('/feedback')}>Give feedback</button>
        </section>

        {isLoading && <div className="page-panel py-12 text-center text-slate-500">Preparing your dashboard...</div>}
        {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">Dashboard data could not be loaded. <button className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>}

        {data?.cards && (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Dashboard summary">
            {summaryCards.slice(0, 4).map(({ key, value }) => (
              <div className="metric-card bg-white" key={key}>
                <span>{key.replace(/_/g, ' ')}</span>
                <strong>{String(value ?? 0)}</strong>
              </div>
            ))}
          </section>
        )}

        <div className="page-panel">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div><h2 className="text-lg font-bold text-slate-950">Workspace</h2><p className="text-sm text-slate-500">Shortcuts based on your access level</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">

            {user?.role === 'super_admin' && (
              <div className="card cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/companies')}>
                <h2 className="text-xl font-semibold mb-2">Company Management</h2>
                <p className="text-gray-600">Manage companies and their settings</p>
                <button className="mt-4 btn-primary">Go to Companies</button>
              </div>
            )}

            {['super_admin', 'company_admin'].includes(user?.role) && (
              <div className="card cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/departments')}>
                <h2 className="text-xl font-semibold mb-2">Department Management</h2>
                <p className="text-gray-600">Manage departments and their settings</p>
                <button className="mt-4 btn-primary">Go to Departments</button>
              </div>
            )}

            {['super_admin'].includes(user?.role) && (
              <div className="card cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/users')}>
                <h2 className="text-xl font-semibold mb-2">User Management</h2>
                <p className="text-gray-600">Manage super admin and company admin accounts</p>
                <button className="mt-4 btn-primary">Go to Users</button>
              </div>
            )}
          </div>
        </div>

        {user?.role === 'employee' && data?.trend && data.trend.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Monthly Trend</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey={user?.role === 'employee' ? 'average_rating' : 'feedback_count'} stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data?.category && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Category Ratings</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={Object.entries(data.category).map(([name, value]) => ({ name, value: Number(value || 0) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {user?.role === 'company_admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Monthly Feedback Trend</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data?.monthlyFeedback || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="feedback_count" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card lg:col-span-2">

              <h2 className="text-xl font-semibold mb-4">Department Ranking</h2>
              <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-left">Feedback Count</th>
                      <th className="px-4 py-2 text-left">Average Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.departmentRanking || []).map((item) => (
                      <tr key={item.department_name} className="border-b">
                        <td className="px-4 py-2" data-label="Department">{item.department_name}</td>
                        <td className="px-4 py-2" data-label="Feedback Count">{item.feedback_count}</td>
                        <td className="px-4 py-2" data-label="Average Score">{item.average_score ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'super_admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Company Ranking</h2>

              <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-2 text-left">Company</th>
                      <th className="px-4 py-2 text-left">Feedback Count</th>
                      <th className="px-4 py-2 text-left">Average Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.companyRanking || []).map((item) => (
                      <tr key={item.company_name} className="border-b">
                        <td className="px-4 py-2" data-label="Company">{item.company_name}</td>
                        <td className="px-4 py-2" data-label="Feedback Count">{item.feedback_count}</td>
                        <td className="px-4 py-2" data-label="Average Score">{item.average_score ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Monthly Feedback</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.monthlyFeedback || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="feedback_count" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Category Averages</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.categoryAverages ? Object.entries(data.categoryAverages).map(([name, value]) => ({ name, value: Number(value || 0) })) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Top Companies by Feedback</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.topCompaniesByFeedback || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="feedback_count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Top Companies by Score</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.topCompaniesByAverageScore || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company_name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="average_score" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


        {data?.latestFeedback && (



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Latest Feedback</h2>

              <div className="space-y-3">
                {(data.latestFeedback || []).slice(0, 5).map((item) => (

                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="mb-1 text-sm text-gray-500">
                      {item.is_anonymous ? <span className="anonymous-badge">Anonymous user</span> : <span>{item.given_by_name}</span>}
                    </div>
                    <div className="font-medium">Rating: {item.overall_rating}</div>
                    <div className="text-gray-600 text-sm">{item.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
