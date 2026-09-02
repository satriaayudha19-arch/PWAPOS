import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { syncAll } from '../services/syncService';

/**
 * Keeps the Zustand online flag in sync with the browser and triggers an
 * automatic sync the moment connectivity is restored.
 */
export function useNetworkSync(): void {
  const setOnline = useAppStore((s) => s.setOnline);
  const showToast = useAppStore((s) => s.showToast);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      showToast('Kembali online — menyinkronkan…', 'info');
      // Fire and forget; syncAll manages its own state + toasts.
      void syncAll();
    };
    const handleOffline = () => {
      setOnline(false);
      showToast('Mode offline — data disimpan lokal.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, showToast]);
}
