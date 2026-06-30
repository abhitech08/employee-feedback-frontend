import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';

const ForgotPasswordPage = ({ theme, setTheme }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    setResetLink('');
    try {
      const response = await authService.forgotPassword(data.email);
      setMessage(response.message || 'Reset link generated');
      if (response.resetLink) {
        setResetLink(response.resetLink);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to generate reset link');
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
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-800">Forgot Password</h1>
        <p className="text-center text-gray-600 mb-6">Enter your email to generate a reset link</p>

        {message && <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">{message}</div>}
        {resetLink && <div className="mb-4 text-sm break-all bg-gray-100 p-3 rounded">{resetLink}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input type="email" {...register('email', { required: 'Email is required' })} className="input-field" placeholder="Enter your email" />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary font-semibold">{loading ? 'Generating...' : 'Generate Reset Link'}</button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
