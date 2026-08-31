export const formatMarkValue = (value, isTimeBased, unit) => {
  if (value === null || value === undefined) return '-';
  const v = Number(value);
  if (isTimeBased) {
    if (v >= 3600) {
      const h = Math.floor(v / 3600);
      const m = Math.floor((v % 3600) / 60);
      const s = (v % 60).toFixed(2);
      return `${h}:${String(m).padStart(2, '0')}:${s.padStart(5, '0')}`;
    }
    if (v >= 60) {
      const m = Math.floor(v / 60);
      const s = (v % 60).toFixed(2);
      return `${m}:${s.padStart(5, '0')}`;
    }
    return `${v.toFixed(2)}s`;
  }
  const trimmed = String(Math.round(v * 1000) / 1000).replace(/\.?0+$/, '');
  if (String(unit || '').toLowerCase().includes('metro')) return `${trimmed} m`;
  return trimmed;
};

export const formatMark = (row) => {
  if (row.mark && String(row.mark).trim() !== '') return String(row.mark).trim();
  return formatMarkValue(row.value, row.is_time_based, row.unit);
};

export const effClassCode = (isTrack, code, fallback) => {
  const c = String(code || fallback || '');
  return isTrack && c.startsWith('F') && c.length > 1 ? 'T' + c.slice(1) : c;
};

export const medalOf = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};