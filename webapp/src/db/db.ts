import Dexie, { type Table } from 'dexie';

// ============================================================================
// TypeScript interfaces — mirror the required schema EXACTLY.
// ============================================================================

export interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Pen {
  id: number;
  owner_id: number;
  pen_number: string;
  capacity: number;
}

export type Gender = 'M' | 'F';
export type LivestockStatus = 'ACTIVE' | 'QUARANTINED' | 'SOLD';

export interface Livestock {
  id: number;
  owner_id: number;
  pen_id: number;
  rfid_uid: string; // unique
  register_number: string; // unique
  breed: string;
  birth_date: string;
  gender: Gender;
  status: LivestockStatus;
  sire_id?: number;
  dam_id?: number;
}

export interface HealthLog {
  id: number;
  livestock_id: number;
  weight: number;
  temperature: number;
  is_fertile: boolean;
  notes: string;
  recorded_at: string;
  synced: boolean;
}

export type TaskType = 'FEEDING' | 'VACCINATION' | 'MEDICAL_TREATMENT';
export type ScheduleStatus = 'PENDING' | 'COMPLETED';

export interface Schedule {
  id: number;
  owner_id: number;
  livestock_id: number;
  task_type: TaskType;
  scheduled_date: string;
  status: ScheduleStatus;
  synced: boolean;
}

export type QuarantineStatus = 'ISOLATED' | 'RECOVERED' | 'DECEASED';

export interface QuarantineLog {
  id: number;
  livestock_id: number;
  disease_detected: string;
  start_date: string;
  end_date?: string;
  treatment_given: string;
  status: QuarantineStatus;
  synced: boolean;
}

// ============================================================================
// Dexie database — indexes on rfid_uid, register_number, livestock_id, synced.
// ============================================================================

export class LivestockDB extends Dexie {
  owners!: Table<Owner, number>;
  pens!: Table<Pen, number>;
  livestock!: Table<Livestock, number>;
  healthLogs!: Table<HealthLog, number>;
  schedules!: Table<Schedule, number>;
  quarantineLogs!: Table<QuarantineLog, number>;

  constructor() {
    super('IndonesiaLivestockDB');
    this.version(1).stores({
      owners: '++id, email',
      pens: '++id, owner_id, pen_number',
      // &rfid_uid / &register_number => unique indexes
      livestock:
        '++id, owner_id, pen_id, &rfid_uid, &register_number, status, breed',
      healthLogs: '++id, livestock_id, synced, recorded_at',
      schedules: '++id, owner_id, livestock_id, status, synced, scheduled_date',
      quarantineLogs: '++id, livestock_id, status, synced, start_date',
    });
  }
}

export const db = new LivestockDB();
