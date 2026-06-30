const statusStyles = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  inactive: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
};

export default function StatusBadge({ value }) {
  const normalized = String(value || 'inactive').toLowerCase();
  const label = normalized.replace(/_/g, ' ');
  const className = statusStyles[normalized] || statusStyles.warning;

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>
      {label}
    </span>
  );
}
