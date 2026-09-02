// Money helpers. All monetary values are stored/handled as integer cents to avoid float errors.
export const toCents = (v) => Math.round(Number(v) * 100);
export const fromCents = (c) => (Number(c) / 100).toFixed(2);
export const formatIDR = (c) => {
  const n = Number(c) / 100;
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
