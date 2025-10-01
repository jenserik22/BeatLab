import { DEFAULTS } from '../constants/config';

export const dbToPercent = (db, min = DEFAULTS.VOLUME_MIN, max = DEFAULTS.VOLUME_MAX) => {
  if (!Number.isFinite(db)) return 0;
  const clamped = Math.min(Math.max(db, min), max);
  return Math.round(((clamped - min) / (max - min)) * 100);
};

export const percentToDb = (pct, min = DEFAULTS.VOLUME_MIN, max = DEFAULTS.VOLUME_MAX) => {
  const p = Math.min(Math.max(pct, 0), 100);
  return min + (p / 100) * (max - min);
};
