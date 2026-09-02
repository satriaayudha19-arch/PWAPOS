import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import { useAppStore } from '../store/useAppStore';
import { ageFromBirth, genderLabel, haptic, statusLabel } from '../lib/utils';

function StatCard({
  label,
  value,
  icon,
  tone,
  testId,
}: {
  label: string;
  value: number | string;
  icon: string;
  tone: 'brand' | 'blue' | 'red' | 'amber';
  testId: string;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <div
      data-testid={testId}
      className={`rounded-2xl border p-4 ${tones[tone]} flex flex-col gap-1`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-extrabold tabular-nums">{value}</span>
      </div>
      <span className="text-xs font-semibold opacity-80 leading-tight">
        {label}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const pendingSync = useAppStore((s) => s.pendingSync);

  const livestock = useLiveQuery(() => db.livestock.toArray(), [], []);
  const pens = useLiveQuery(() => db.pens.toArray(), [], []);

  const total = livestock.filter((l) => l.status !== 'SOLD').length;
  const quarantined = livestock.filter((l) => l.status === 'QUARANTINED');
  const activePens = pens.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Selamat datang 👋</h2>
        <p className="text-sm text-slate-500">Ringkasan peternakan Anda hari ini.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          testId="stat-total-livestock"
          label="Total Ternak"
          value={total}
          icon="🐄"
          tone="brand"
        />
        <StatCard
          testId="stat-active-pens"
          label="Kandang Aktif"
          value={activePens}
          icon="🏠"
          tone="blue"
        />
        <StatCard
          testId="stat-quarantine"
          label="Peringatan Karantina"
          value={quarantined.length}
          icon="⚠️"
          tone="red"
        />
        <StatCard
          testId="stat-pending-sync"
          label="Menunggu Sinkron"
          value={pendingSync}
          icon="☁️"
          tone="amber"
        />
      </div>

      {/* Quarantine alert strip */}
      {quarantined.length > 0 && (
        <div
          data-testid="quarantine-alert-strip"
          className="rounded-2xl bg-red-600 text-white p-4 flex items-center gap-3"
        >
          <span className="text-2xl">🚨</span>
          <div className="flex-1">
            <p className="font-bold text-sm">
              {quarantined.length} ternak dalam karantina
            </p>
            <p className="text-xs text-red-100">Perlu perhatian & perawatan.</p>
          </div>
        </div>
      )}

      {/* Livestock list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900">Daftar Ternak</h3>
          <button
            data-testid="dashboard-scan-cta"
            onClick={() => {
              haptic(20);
              navigate('/scan');
            }}
            className="text-sm font-semibold text-brand-700"
          >
            Pindai NFC →
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {livestock.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400 text-sm">
              Belum ada data ternak.
            </div>
          )}
          {livestock.map((l) => (
            <button
              key={l.id}
              data-testid={`livestock-card-${l.id}`}
              onClick={() => {
                haptic(20);
                navigate(`/livestock/${l.id}`);
              }}
              className="w-full text-left rounded-2xl bg-white border border-slate-200 p-3 flex items-center gap-3 active:bg-slate-50 min-h-[48px]"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-xl shrink-0">
                {l.gender === 'M' ? '🐂' : '🐄'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">
                  {l.register_number}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {l.breed} • {genderLabel(l.gender)} • {ageFromBirth(l.birth_date)}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${
                  l.status === 'ACTIVE'
                    ? 'bg-brand-100 text-brand-700'
                    : l.status === 'QUARANTINED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                {statusLabel(l.status)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
