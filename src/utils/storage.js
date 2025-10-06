import { DEFAULTS } from '../constants/config';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

const safeParse = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_e) {
    return fallback;
  }
};

export const readJSON = (key, fallback) => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return safeParse(raw, fallback);
  } catch (_e) {
    return fallback;
  }
};

export const writeJSON = (key, data) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (_e) {
    /* ignore */
  }
};

// Schema helpers
const boolArray = (len, src) => {
  const out = Array(len).fill(false);
  if (Array.isArray(src)) {
    for (let i = 0; i < Math.min(len, src.length); i++) {
      out[i] = !!src[i];
    }
  }
  return out;
};

const createEmptyPattern = (drumSounds, stepCount = 16) => {
  const p = {};
  drumSounds.forEach(s => { p[s.name] = Array(stepCount).fill(false); });
  return p;
};

const defaultVolumes = (drumSounds, value = -10) => {
  const v = {};
  drumSounds.forEach(s => { v[s.name] = typeof value === 'number' ? value : -10; });
  return v;
};

export const normalizePatternOnly = (raw, drumSounds, stepCount = 16) => {
  const empty = createEmptyPattern(drumSounds, stepCount);
  if (!raw || typeof raw !== 'object') return empty;
  const out = {};
  drumSounds.forEach(s => {
    out[s.name] = boolArray(stepCount, raw[s.name]);
  });
  return out;
};

// Adaptation helpers
export const adaptPatternToStepCount = (pattern, drumSounds, toStepCount) => {
  // Non-destructive resize: preserve existing steps in order.
  // - If increasing, append false values
  // - If decreasing, truncate from the end
  if (!pattern || typeof pattern !== 'object') return createEmptyPattern(drumSounds, toStepCount);
  const out = {};
  drumSounds.forEach(s => {
    const src = Array.isArray(pattern[s.name]) ? pattern[s.name].map(Boolean) : [];
    const len = src.length;
    if (toStepCount <= len) {
      out[s.name] = src.slice(0, toStepCount);
    } else {
      out[s.name] = src.concat(Array(toStepCount - len).fill(false));
    }
  });
  return out;
};

export const createPatternDataDefaults = (drumSounds, stepCount = 16) => ({
  pattern: createEmptyPattern(drumSounds, stepCount),
  drumVolumes: defaultVolumes(drumSounds, -10),
  masterVolume: -10,
  filterFreq: 20000,
  filterQ: 1,
  loop1Playing: false, loop1Volume: -10,
  loop2Playing: false, loop2Volume: -10,
  loop3Playing: false, loop3Volume: -10,
  loop4Playing: false, loop4Volume: -10,
  loop5Playing: false, loop5Volume: -10,
  loop6Playing: false, loop6Volume: -10,
  stepCount,
  bpm: DEFAULTS.BPM,
});

export const normalizePatternData = (raw, drumSounds, preferredStepCount = 16) => {
  const stepCount = Number.isInteger(raw?.stepCount) ? raw.stepCount : preferredStepCount;
  const d = createPatternDataDefaults(drumSounds, stepCount);
  if (!raw || typeof raw !== 'object') return d;
  // Backward compatibility: raw is just pattern map
  if (raw.pattern == null && Object.keys(raw).length) {
    return { ...d, pattern: normalizePatternOnly(raw, drumSounds, stepCount) };
  }

  const n = { ...d };
  n.pattern = normalizePatternOnly(raw.pattern, drumSounds, stepCount);

  // Drum volumes
  const dv = raw.drumVolumes && typeof raw.drumVolumes === 'object' ? raw.drumVolumes : {};
  const normDv = {};
  drumSounds.forEach(s => {
    const val = dv[s.name];
    normDv[s.name] = Number.isFinite(val) ? val : -10;
  });
  n.drumVolumes = normDv;

  const numOr = (val, fb) => (Number.isFinite(val) ? val : fb);
  n.masterVolume = numOr(raw.masterVolume, d.masterVolume);
  n.filterFreq = numOr(raw.filterFreq, d.filterFreq);
  n.filterQ = numOr(raw.filterQ, d.filterQ);

  for (let i = 1; i <= 6; i++) {
    const pKey = `loop${i}Playing`;
    const vKey = `loop${i}Volume`;
    n[pKey] = !!raw[pKey];
    n[vKey] = numOr(raw[vKey], -10);
  }

  n.stepCount = stepCount;
  n.bpm = numOr(raw.bpm, d.bpm);
  return n;
};

// Public API tailored to this app's keys
const KEYS = {
  currentPattern: 'currentBeatLabPattern',
  savedPatterns: 'beatLabSavedPatterns',
  stepCount: 'beatLabStepCount',
};

export const getCurrentPattern = (drumSounds, stepCount = 16) => {
  const raw = readJSON(KEYS.currentPattern, null);
  return normalizePatternOnly(raw, drumSounds, stepCount);
};

export const setCurrentPattern = (pattern) => {
  writeJSON(KEYS.currentPattern, pattern);
};

export const getSavedPatterns = (drumSounds, stepCount = 16) => {
  const raw = readJSON(KEYS.savedPatterns, {});
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  Object.entries(raw).forEach(([name, data]) => {
    out[name] = normalizePatternData(data, drumSounds, data?.stepCount ?? stepCount);
  });
  return out;
};

export const setSavedPatterns = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  writeJSON(KEYS.savedPatterns, obj);
};

// Step count persistence
export const getStepCount = (fallback = 16) => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(KEYS.stepCount);
    const n = parseInt(raw, 10);
    return Number.isInteger(n) ? n : fallback;
  } catch (_e) {
    return fallback;
  }
};

export const setStepCount = (n) => {
  if (!Number.isInteger(n)) return;
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEYS.stepCount, String(n));
  } catch (_e) {
    /* ignore */
  }
};
