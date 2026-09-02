import type { HealthLog, QuarantineLog, Schedule } from '../db/db';

/**
 * Mock in-memory backend.
 *
 * This layer intentionally mimics a REST/Supabase-style client so it can be
 * swapped later. To move to Supabase, replace the bodies of these functions
 * with `supabase.from('health_logs').upsert(rows)` etc. — the signatures and
 * return shapes stay the same.
 */

interface ServerStore {
  health_logs: HealthLog[];
  schedules: Schedule[];
  quarantine_logs: QuarantineLog[];
}

const server: ServerStore = {
  health_logs: [],
  schedules: [],
  quarantine_logs: [],
};

const NETWORK_DELAY_MS = 700;

function upsert<T extends { id: number }>(table: T[], rows: T[]): void {
  for (const row of rows) {
    const idx = table.findIndex((r) => r.id === row.id);
    if (idx >= 0) table[idx] = row;
    else table.push(row);
  }
}

async function withLatency<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, NETWORK_DELAY_MS));
  // Fail fast if the browser is offline — this is what makes the queue matter.
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('OFFLINE: tidak ada koneksi internet.');
  }
  return value;
}

export interface PushResult {
  ok: boolean;
  count: number;
}

export const mockApi = {
  async pushHealthLogs(rows: HealthLog[]): Promise<PushResult> {
    await withLatency(null);
    upsert(server.health_logs, rows);
    return { ok: true, count: rows.length };
  },

  async pushSchedules(rows: Schedule[]): Promise<PushResult> {
    await withLatency(null);
    upsert(server.schedules, rows);
    return { ok: true, count: rows.length };
  },

  async pushQuarantineLogs(rows: QuarantineLog[]): Promise<PushResult> {
    await withLatency(null);
    upsert(server.quarantine_logs, rows);
    return { ok: true, count: rows.length };
  },

  // Handy for debugging what the "server" currently holds.
  _dump(): ServerStore {
    return server;
  },
};
