import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Gender } from '../db/db';
import { useAppStore } from '../store/useAppStore';
import { haptic } from '../lib/utils';

export default function AddData() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);

  const pens = useLiveQuery(() => db.pens.toArray(), [], []);
  const owners = useLiveQuery(() => db.owners.toArray(), [], []);

  const [registerNumber, setRegisterNumber] = useState('');
  const [rfid, setRfid] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('F');
  const [penId, setPenId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  const valid = registerNumber.trim() && breed.trim() && birthDate && penId !== '';

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const ownerId = owners[0]?.id ?? 1;
      const rfidValue =
        rfid.trim() || `AUTO:${Date.now().toString(16).toUpperCase()}`;

      await db.livestock.add({
        owner_id: ownerId,
        pen_id: Number(penId),
        rfid_uid: rfidValue,
        register_number: registerNumber.trim(),
        breed: breed.trim(),
        birth_date: birthDate,
        gender,
        status: 'ACTIVE',
      } as never);

      haptic([40, 30, 40]);
      showToast(`Ternak ${registerNumber.trim()} ditambahkan.`, 'success');
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan.';
      // Unique-constraint violation on register_number / rfid_uid lands here.
      showToast(`Gagal: nomor registrasi / RFID sudah dipakai.`, 'error');
      console.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Tambah Data Ternak</h2>
        <p className="text-sm text-slate-500">Daftarkan ternak baru ke peternakan.</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Nomor Registrasi *</span>
          <input
            data-testid="add-register-input"
            value={registerNumber}
            onChange={(e) => setRegisterNumber(e.target.value)}
            placeholder="mis. LIVESTOCK-0006"
            className="h-12 rounded-xl border border-slate-300 px-3 text-base focus:border-brand-600 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">RFID / NFC UID</span>
          <input
            data-testid="add-rfid-input"
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
            placeholder="Kosongkan untuk otomatis"
            className="h-12 rounded-xl border border-slate-300 px-3 text-base focus:border-brand-600 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Ras / Breed *</span>
          <input
            data-testid="add-breed-input"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="mis. Sapi Limousin"
            className="h-12 rounded-xl border border-slate-300 px-3 text-base focus:border-brand-600 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Tanggal Lahir *</span>
          <input
            data-testid="add-birthdate-input"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-12 rounded-xl border border-slate-300 px-3 text-base focus:border-brand-600 outline-none"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Jenis Kelamin *</span>
          <div className="flex gap-2">
            {(['F', 'M'] as Gender[]).map((g) => (
              <button
                key={g}
                data-testid={`add-gender-${g}`}
                onClick={() => setGender(g)}
                className={`flex-1 h-12 rounded-xl font-semibold border ${
                  gender === g
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {g === 'F' ? '🐄 Betina' : '🐂 Jantan'}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Kandang *</span>
          <select
            data-testid="add-pen-select"
            value={penId}
            onChange={(e) => setPenId(e.target.value ? Number(e.target.value) : '')}
            className="h-12 rounded-xl border border-slate-300 px-3 text-base bg-white focus:border-brand-600 outline-none"
          >
            <option value="">Pilih kandang…</option>
            {pens.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pen_number} (kapasitas {p.capacity})
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        data-testid="add-save-button"
        onClick={save}
        disabled={!valid || saving}
        className="h-13 min-h-[52px] rounded-xl bg-brand-600 text-white font-bold text-base active:bg-brand-700 disabled:opacity-50"
      >
        {saving ? 'Menyimpan…' : 'Simpan Ternak'}
      </button>
    </div>
  );
}
