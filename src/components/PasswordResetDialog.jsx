import { useEffect, useState } from 'react';

const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export default function PasswordResetDialog({ open, user, loading, error = '', onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
      setValidationError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (!passwordRules.test(password)) {
      setValidationError('Use uppercase, lowercase, number, and special character.');
      return;
    }
    onConfirm?.(password);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h2 id="reset-password-title" className="text-xl font-bold text-slate-950 dark:text-white">Reset Password</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Set a new password for {user?.name || 'this user'}.</p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">New password</label>
            <input className="input-field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
          </div>
          {(validationError || error) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError || error}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-neutral flex-1" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
