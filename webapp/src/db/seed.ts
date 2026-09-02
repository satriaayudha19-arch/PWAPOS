import { db } from './db';

const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const dateDaysAgo = (days: number) => isoDaysAgo(days).slice(0, 10);

/**
 * Seed the local database with mock data so the app is testable immediately.
 * Runs only once (when the livestock table is empty).
 */
export async function seedDatabase(): Promise<void> {
  const count = await db.livestock.count();
  if (count > 0) return;

  await db.transaction(
    'rw',
    [db.owners, db.pens, db.livestock, db.healthLogs, db.quarantineLogs, db.schedules],
    async () => {
      await db.owners.bulkAdd([
        {
          id: 1,
          name: 'Pak Budi Santoso',
          email: 'budi.santoso@peternak.id',
          phone: '+62 812-3456-7890',
        },
      ]);

      await db.pens.bulkAdd([
        { id: 1, owner_id: 1, pen_number: 'KANDANG-A', capacity: 20 },
        { id: 2, owner_id: 1, pen_number: 'KANDANG-B', capacity: 15 },
        { id: 3, owner_id: 1, pen_number: 'ISOLASI-01', capacity: 5 },
      ]);

      await db.livestock.bulkAdd([
        {
          id: 1,
          owner_id: 1,
          pen_id: 1,
          rfid_uid: '04:A2:B3:C4:D5:E6:F7',
          register_number: 'LIVESTOCK-0001',
          breed: 'Sapi Limousin',
          birth_date: '2022-03-15',
          gender: 'F',
          status: 'ACTIVE',
        },
        {
          id: 2,
          owner_id: 1,
          pen_id: 1,
          rfid_uid: '04:11:22:33:44:55:66',
          register_number: 'LIVESTOCK-0002',
          breed: 'Sapi Simental',
          birth_date: '2021-08-02',
          gender: 'M',
          status: 'ACTIVE',
        },
        {
          id: 3,
          owner_id: 1,
          pen_id: 2,
          rfid_uid: '04:77:88:99:AA:BB:CC',
          register_number: 'LIVESTOCK-0003',
          breed: 'Sapi Brahman',
          birth_date: '2023-01-20',
          gender: 'F',
          status: 'ACTIVE',
          sire_id: 2,
          dam_id: 1,
        },
        {
          id: 4,
          owner_id: 1,
          pen_id: 3,
          rfid_uid: '04:DE:AD:BE:EF:00:11',
          register_number: 'LIVESTOCK-0004',
          breed: 'Sapi Bali',
          birth_date: '2022-11-11',
          gender: 'M',
          status: 'QUARANTINED',
        },
        {
          id: 5,
          owner_id: 1,
          pen_id: 2,
          rfid_uid: '04:CA:FE:BA:BE:22:33',
          register_number: 'LIVESTOCK-0005',
          breed: 'Sapi Peranakan Ongole',
          birth_date: '2020-05-30',
          gender: 'F',
          status: 'ACTIVE',
          dam_id: 1,
        },
      ]);

      await db.healthLogs.bulkAdd([
        {
          id: 1,
          livestock_id: 1,
          weight: 380,
          temperature: 38.5,
          is_fertile: true,
          notes: 'Kondisi sehat, nafsu makan baik.',
          recorded_at: isoDaysAgo(60),
          synced: true,
        },
        {
          id: 2,
          livestock_id: 1,
          weight: 402,
          temperature: 38.6,
          is_fertile: true,
          notes: 'Berat naik stabil.',
          recorded_at: isoDaysAgo(30),
          synced: true,
        },
        {
          id: 3,
          livestock_id: 1,
          weight: 418,
          temperature: 38.7,
          is_fertile: true,
          notes: 'Pemeriksaan rutin bulanan.',
          recorded_at: isoDaysAgo(2),
          synced: false,
        },
        {
          id: 4,
          livestock_id: 2,
          weight: 520,
          temperature: 38.9,
          is_fertile: true,
          notes: 'Pejantan unggul.',
          recorded_at: isoDaysAgo(10),
          synced: true,
        },
        {
          id: 5,
          livestock_id: 4,
          weight: 295,
          temperature: 40.2,
          is_fertile: false,
          notes: 'Demam tinggi, dipindah ke isolasi.',
          recorded_at: isoDaysAgo(5),
          synced: false,
        },
      ]);

      await db.quarantineLogs.bulkAdd([
        {
          id: 1,
          livestock_id: 4,
          disease_detected: 'Suspek PMK (demam & lesu)',
          start_date: dateDaysAgo(5),
          treatment_given: 'Antibiotik + antipiretik, observasi harian.',
          status: 'ISOLATED',
          synced: false,
        },
      ]);

      await db.schedules.bulkAdd([
        {
          id: 1,
          owner_id: 1,
          livestock_id: 3,
          task_type: 'VACCINATION',
          scheduled_date: dateDaysAgo(-3),
          status: 'PENDING',
          synced: true,
        },
      ]);
    }
  );
}
