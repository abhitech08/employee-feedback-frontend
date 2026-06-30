import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ type = 'success', title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const toast = { id, type, title, message };
      setToasts((prev) => [toast, ...prev]);

      if (duration > 0) {
        window.setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const value = useMemo(() => ({ pushToast, removeToast }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-[60] flex w-[calc(100vw-2rem)] max-w-md flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              t.type === 'success'
                ? 'rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm'
                : t.type === 'warning'
                  ? 'rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm'
                  : t.type === 'error'
                    ? 'rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm'
                    : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
            }
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {t.title && <div className="text-sm font-bold text-slate-900">{t.title}</div>}
                {t.message && (
                  <div className="mt-1 text-sm leading-snug text-slate-700">{t.message}</div>
                )}
              </div>
              <button
                type="button"
                className="min-h-0 rounded-lg px-2 py-1 text-sm font-bold text-slate-600 hover:bg-black/5"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used within ToastProvider');
  return ctx;
}

