import { create } from 'zustand';
import { db } from '../db/db';

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  isOnline: boolean;
  pendingSync: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  toast: ToastState | null;

  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (iso: string) => void;
  refreshPending: () => Promise<void>;
  showToast: (message: string, type?: ToastState['type']) => void;
  clearToast: () => void;
}

let toastCounter = 0;

/**
 * Count every unsynced record across the three sync-tracked tables.
 * HealthLog / Schedule / QuarantineLog each carry the `synced` flag.
 */
async function countPending(): Promise<number> {
  // NOTE: IndexedDB cannot index boolean keys, so `synced` must be queried
  // with a filter rather than an indexed `.where()` lookup.
  const [health, schedules, quarantine] = await Promise.all([
    db.healthLogs.filter((r) => r.synced === false).count(),
    db.schedules.filter((r) => r.synced === false).count(),
    db.quarantineLogs.filter((r) => r.synced === false).count(),
  ]);
  return health + schedules + quarantine;
}

export const useAppStore = create<AppState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSync: 0,
  isSyncing: false,
  lastSyncedAt: null,
  toast: null,

  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),

  refreshPending: async () => {
    const pending = await countPending();
    set({ pendingSync: pending });
  },

  showToast: (message, type = 'info') => {
    const id = ++toastCounter;
    set({ toast: { id, message, type } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 3200);
  },
  clearToast: () => set({ toast: null }),
}));
