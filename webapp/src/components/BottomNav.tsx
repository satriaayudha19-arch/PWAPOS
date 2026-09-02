import { useNavigate, useLocation } from 'react-router-dom';
import { haptic } from '../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  testId: string;
}

const items: NavItem[] = [
  { path: '/', label: 'Beranda', icon: '🏠', testId: 'nav-dashboard' },
  { path: '/add', label: 'Tambah', icon: '➕', testId: 'nav-add' },
  { path: '/scan', label: 'Pindai', icon: '📡', testId: 'nav-scan' },
  { path: '/profile', label: 'Profil', icon: '👤', testId: 'nav-profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const go = (path: string) => {
    haptic(20);
    navigate(path);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-16 relative">
        {items.map((item) => {
          const active =
            item.path === '/'
              ? pathname === '/'
              : pathname.startsWith(item.path);

          if (item.path === '/scan') {
            // Prominent center scan button.
            return (
              <button
                key={item.path}
                data-testid={item.testId}
                onClick={() => go(item.path)}
                className="flex flex-col items-center justify-end flex-1 pb-1"
              >
                <div
                  className={`-mt-6 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white transition-colors ${
                    active ? 'bg-brand-700' : 'bg-brand-600'
                  } text-white active:scale-95`}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-[11px] mt-0.5 font-semibold ${
                    active ? 'text-brand-700' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              data-testid={item.testId}
              onClick={() => go(item.path)}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 min-h-[48px]"
            >
              <span
                className={`text-xl transition-transform ${
                  active ? 'scale-110' : 'opacity-60'
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  active ? 'text-brand-700' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
