import { useEffect } from 'react';

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  description = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
  onClose,
  onConfirm
}) {
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    const dialogEl = document.getElementById('confirm-dialog');
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-desc' : undefined}
    >
      <div id="confirm-dialog" className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-slate-950">{title}</h2>
        {description && (
          <p id="confirm-dialog-desc" className="mt-2 text-sm text-slate-600">
            {description}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => onClose?.()}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-4 py-2 font-semibold text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-60`}
            onClick={() => onConfirm?.()}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


