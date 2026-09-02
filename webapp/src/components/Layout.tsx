import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Toast from './Toast';

export default function Layout() {
  const { pathname } = useLocation();
  // The scan screen wants maximum vertical room; other screens get bottom pad.
  const isScan = pathname === '/scan';

  return (
    <div className="min-h-full flex flex-col bg-slate-100">
      <Header />
      <Toast />
      <main
        className="flex-1 w-full max-w-md mx-auto px-4 pt-4"
        style={{ paddingBottom: isScan ? 96 : 96 }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
