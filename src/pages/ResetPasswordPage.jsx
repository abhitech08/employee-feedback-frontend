import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';

const ResetPasswordPage = ({ theme, setTheme }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await authService.resetPassword(token || data.token, data.newPassword);
      setMessage(response.message || 'Password reset successfully');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-700 to-sky-700 flex items-center justify-center p-4">
      <button
        type="button"
        className="btn-neutral fixed right-4 top-4"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      <div className="bg-white rounded-lg shadow-2xl p-5 sm:p-8 w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-800">Reset Password</h1>
        <p className="text-center text-gray-600 mb-6">Create a new password using your reset token</p>

        {message && <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">{message}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          {!token && (
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Token</label>
              <input {...register('token', { required: 'Token is required' })} className="input-field" placeholder="Paste token here" />
              {errors.token && <span className="text-red-500 text-sm">{errors.token.message}</span>}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">New Password</label>
            <input type="password" {...register('newPassword', { required: 'New password is required' })} className="input-field" placeholder="Enter new password" />
            {errors.newPassword && <span className="text-red-500 text-sm">{errors.newPassword.message}</span>}
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary font-semibold">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
