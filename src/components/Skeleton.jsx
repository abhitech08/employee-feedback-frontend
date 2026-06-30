export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200/70 ${className}`} />;
}

