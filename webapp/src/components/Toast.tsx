import { useAppStore } from '../store/useAppStore';

export default function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  if (!toast) return null;

  const palette =
    toast.type === 'success'
      ? 'bg-brand-600'
      : toast.type === 'error'
        ? 'bg-red-600'
        : 'bg-slate-800';

  const icon =
    toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ';

  return (
    <div
      className="fixed inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top) + 64px)' }}
    >
      <div
        data-testid="app-toast"
        onClick={clearToast}
        className={`animate-toast-in pointer-events-auto ${palette} text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-2 max-w-md w-full`}
      >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium flex-1">{toast.message}</span>
      </div>
    </div>
  );
}
