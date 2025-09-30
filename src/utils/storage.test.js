import {
  readJSON,
  writeJSON,
  getCurrentPattern,
  setCurrentPattern,
  getSavedPatterns,
  setSavedPatterns,
  normalizePatternData,
  createPatternDataDefaults,
  adaptPatternToStepCount,
  getStepCount,
  setStepCount,
} from './storage';

const drumSounds = [
  { name: 'Kick', note: 'C2', type: 'membrane' },
  { name: 'Snare', note: 'E2', type: 'noise' },
];

describe('storage utils', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('readJSON returns fallback on malformed JSON', () => {
    window.localStorage.setItem('bad', '{not-json');
    expect(readJSON('bad', { a: 1 })).toEqual({ a: 1 });
  });

  test('getCurrentPattern normalizes shape and coerces values', () => {
    // Invalid shapes and types
    window.localStorage.setItem(
      'currentBeatLabPattern',
      JSON.stringify({ Kick: [1, 'x', 0], Snare: null })
    );
    const p = getCurrentPattern(drumSounds, 3);
    expect(p.Kick).toEqual([true, true, false]);
    expect(p.Snare).toEqual([false, false, false]);
  });

  test('getSavedPatterns handles old and new formats', () => {
    const oldFormat = { Kick: [true, false], Snare: [false, true] };
    const newFormat = createPatternDataDefaults(drumSounds, 2);
    newFormat.pattern = { Kick: [false, true], Snare: [true, false] };
    newFormat.masterVolume = -6;
    const data = { Old: oldFormat, New: newFormat };
    window.localStorage.setItem('beatLabSavedPatterns', JSON.stringify(data));

    const saved = getSavedPatterns(drumSounds, 2);
    expect(saved.Old.pattern.Kick).toEqual([true, false]);
    expect(saved.Old.pattern.Snare).toEqual([false, true]);
    expect(saved.New.pattern.Kick).toEqual([false, true]);
    expect(saved.New.masterVolume).toBe(-6);
  });

  test('set/get roundtrip for saved patterns', () => {
    const patternData = createPatternDataDefaults(drumSounds, 2);
    patternData.pattern.Kick = [true, false];
    const obj = { Foo: normalizePatternData(patternData, drumSounds, 2) };
    setSavedPatterns(obj);
    const out = getSavedPatterns(drumSounds, 2);
    expect(out.Foo.pattern.Kick).toEqual([true, false]);
  });

  test('set/get roundtrip for current pattern', () => {
    const p = { Kick: [true, false, true], Snare: [false, false, true] };
    setCurrentPattern(p);
    expect(getCurrentPattern(drumSounds, 3)).toEqual(p);
  });

  test('adaptPatternToStepCount rescales correctly', () => {
    const p = { Kick: [true, false, false, true], Snare: [false, true, false, false] };
    const up = adaptPatternToStepCount(p, drumSounds, 8);
    expect(up.Kick.length).toBe(8);
    const down = adaptPatternToStepCount(p, drumSounds, 2);
    expect(down.Kick.length).toBe(2);
  });

  test('stepCount persistence', () => {
    setStepCount(24);
    expect(getStepCount(16)).toBe(24);
  });
});
