export function formatDate(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ageFromBirth(birth_date: string): string {
  const b = new Date(birth_date);
  if (isNaN(b.getTime())) return '-';
  const now = new Date();
  let months =
    (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years <= 0) return `${rem} bln`;
  return rem > 0 ? `${years} thn ${rem} bln` : `${years} thn`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Aktif';
    case 'QUARANTINED':
      return 'Karantina';
    case 'SOLD':
      return 'Terjual';
    case 'ISOLATED':
      return 'Diisolasi';
    case 'RECOVERED':
      return 'Sembuh';
    case 'DECEASED':
      return 'Mati';
    default:
      return status;
  }
}

export function genderLabel(g: string): string {
  return g === 'M' ? 'Jantan' : 'Betina';
}

/** Simulated haptic feedback — vibrate where supported. */
export function haptic(pattern: number | number[] = 40): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* no-op */
  }
}
