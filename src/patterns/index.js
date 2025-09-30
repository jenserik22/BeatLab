import { adaptPatternToStepCount } from '../utils/storage';

const BASE_16 = (drumSounds) => ({
  Empty: (() => {
    const out = {};
    drumSounds.forEach(s => { out[s.name] = Array(16).fill(false); });
    return out;
  })(),
  'Rock Beat': {
    'Kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    'Snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    'Closed Hi-Hat': Array(16).fill(true),
    'Open Hi-Hat': Array(16).fill(false),
    'Clap': Array(16).fill(false),
    'Crash': [true, false, false, false, ...Array(12).fill(false)],
    'Tom Low': Array(16).fill(false),
    'Tom High': Array(16).fill(false),
  },
  'Hip-Hop': {
    'Kick': [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
    'Snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    'Closed Hi-Hat': Array.from({ length: 16 }, (_, i) => i % 2 === 1),
    'Open Hi-Hat': Array(16).fill(false),
    'Clap': Array(16).fill(false),
    'Crash': Array(16).fill(false),
    'Tom Low': Array(16).fill(false),
    'Tom High': Array(16).fill(false),
  },
  'Techno': {
    'Kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    'Snare': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    'Closed Hi-Hat': Array(16).fill(true),
    'Open Hi-Hat': Array(16).fill(false),
    'Clap': Array(16).fill(false),
    'Crash': Array(16).fill(false),
    'Tom Low': Array(16).fill(false),
    'Tom High': Array(16).fill(false),
  },
  'Breakbeat': {
    'Kick': [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
    'Snare': [false, false, true, false, false, false, false, false, true, false, false, false, false, false, true, false],
    'Closed Hi-Hat': Array.from({ length: 16 }, (_, i) => i % 2 === 1),
    'Open Hi-Hat': Array(16).fill(false),
    'Clap': Array(16).fill(false),
    'Crash': Array(16).fill(false),
    'Tom Low': Array(16).fill(false),
    'Tom High': Array(16).fill(false),
  },
});

export const getPredefinedPatterns = (drumSounds, stepCount) => {
  const base = BASE_16(drumSounds);
  const out = {};
  Object.entries(base).forEach(([name, pattern]) => {
    out[name] = adaptPatternToStepCount(pattern, drumSounds, stepCount);
  });
  return out;
};
