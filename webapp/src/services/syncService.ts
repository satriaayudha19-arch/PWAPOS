import { db } from '../db/db';
import { mockApi } from '../api/mockApi';
import { useAppStore } from '../store/useAppStore';

export interface SyncOutcome {
  ok: boolean;
  synced: number;
  message: string;
}

/**
 * Read every record where synced === false, push to the (mock) API, and mark
 * synced === true only on success. On failure the record stays unsynced so it
 * will be retried on the next sync.
 */
export async function syncAll(): Promise<SyncOutcome> {
  const store = useAppStore.getState();

  if (store.isSyncing) {
    return { ok: false, synced: 0, message: 'Sinkronisasi sedang berjalan.' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    store.showToast('Tidak ada koneksi. Data disimpan untuk nanti.', 'error');
    return { ok: false, synced: 0, message: 'Offline' };
  }

  // IndexedDB cannot index booleans — filter instead of indexed `.where()`.
  const [pendingHealth, pendingSchedules, pendingQuarantine] = await Promise.all([
    db.healthLogs.filter((r) => r.synced === false).toArray(),
    db.schedules.filter((r) => r.synced === false).toArray(),
    db.quarantineLogs.filter((r) => r.synced === false).toArray(),
  ]);

  const total =
    pendingHealth.length + pendingSchedules.length + pendingQuarantine.length;

  if (total === 0) {
    store.showToast('Semua data sudah tersinkron.', 'info');
    return { ok: true, synced: 0, message: 'Nothing to sync' };
  }

  store.setSyncing(true);
  let syncedCount = 0;

  try {
    if (pendingHealth.length) {
      await mockApi.pushHealthLogs(pendingHealth);
      await db.healthLogs.bulkPut(
        pendingHealth.map((r) => ({ ...r, synced: true }))
      );
      syncedCount += pendingHealth.length;
    }

    if (pendingSchedules.length) {
      await mockApi.pushSchedules(pendingSchedules);
      await db.schedules.bulkPut(
        pendingSchedules.map((r) => ({ ...r, synced: true }))
      );
      syncedCount += pendingSchedules.length;
    }

    if (pendingQuarantine.length) {
      await mockApi.pushQuarantineLogs(pendingQuarantine);
      await db.quarantineLogs.bulkPut(
        pendingQuarantine.map((r) => ({ ...r, synced: true }))
      );
      syncedCount += pendingQuarantine.length;
    }

    const now = new Date().toISOString();
    store.setLastSyncedAt(now);
    await store.refreshPending();
    store.showToast(`Berhasil sinkron ${syncedCount} data.`, 'success');
    return { ok: true, synced: syncedCount, message: 'Synced' };
  } catch (err) {
    // Records already synced stay synced; the rest remain synced:false to retry.
    await store.refreshPending();
    const msg = err instanceof Error ? err.message : 'Gagal sinkronisasi.';
    store.showToast(`Sinkronisasi gagal: ${msg}`, 'error');
    return { ok: false, synced: syncedCount, message: msg };
  } finally {
    store.setSyncing(false);
  }
}
