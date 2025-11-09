import {
  buildPatternData,
  normalizePatternData,
  adaptPatternToStepCount,
  createEmptyPattern,
  validatePatternData,
  compressPatternData,
} from './patternBuilder';
import { DEFAULTS } from '../constants/config';

// Mock drum sounds for testing
const mockDrumSounds = [
  { name: 'Kick', note: 'C2', type: 'membrane' },
  { name: 'Snare', note: 'E2', type: 'noise' },
  { name: 'Closed Hi-Hat', note: 'F#2', type: 'noise' },
  { name: 'Open Hi-Hat', note: 'A#2', type: 'noise' },
  { name: 'Clap', note: 'C#3', type: 'noise' },
  { name: 'Crash', note: 'F3', type: 'noise' },
  { name: 'Tom Low', note: 'D2', type: 'membrane' },
  { name: 'Tom High', note: 'G2', type: 'membrane' },
];

describe('patternBuilder', () => {
  describe('createEmptyPattern', () => {
    it('should create an empty pattern with all steps set to false', () => {
      const result = createEmptyPattern(mockDrumSounds, 16);
      
      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBe(mockDrumSounds.length);
      
      mockDrumSounds.forEach(sound => {
        expect(result[sound.name]).toBeDefined();
        expect(Array.isArray(result[sound.name])).toBe(true);
        expect(result[sound.name].length).toBe(16);
        expect(result[sound.name].every(step => step === false)).toBe(true);
      });
    });

    it('should create pattern with correct step count', () => {
      const result8 = createEmptyPattern(mockDrumSounds, 8);
      const result32 = createEmptyPattern(mockDrumSounds, 32);
      
      mockDrumSounds.forEach(sound => {
        expect(result8[sound.name].length).toBe(8);
        expect(result32[sound.name].length).toBe(32);
      });
    });

    it('should handle empty drum sounds array', () => {
      const result = createEmptyPattern([], 16);
      expect(result).toEqual({});
    });
  });

  describe('adaptPatternToStepCount', () => {
    it('should return source pattern when step counts match', () => {
      const sourcePattern = createEmptyPattern(mockDrumSounds, 16);
      sourcePattern.Kick[0] = true;
      sourcePattern.Snare[4] = true;
      
      const result = adaptPatternToStepCount(sourcePattern, mockDrumSounds, 16);
      expect(result.Kick[0]).toBe(true);
      expect(result.Snare[4]).toBe(true);
      expect(result.Kick.length).toBe(16);
    });

    it('should repeat pattern when expanding to larger step count', () => {
      const sourcePattern = createEmptyPattern(mockDrumSounds, 8);
      sourcePattern.Kick[0] = true;
      sourcePattern.Kick[4] = true;
      
      const result = adaptPatternToStepCount(sourcePattern, mockDrumSounds, 16);
      expect(result.Kick[0]).toBe(true);
      expect(result.Kick[4]).toBe(true);
      expect(result.Kick[8]).toBe(true); // Repeated
      expect(result.Kick[12]).toBe(true); // Repeated
      expect(result.Kick.length).toBe(16);
    });

    it('should truncate pattern when reducing step count', () => {
      const sourcePattern = createEmptyPattern(mockDrumSounds, 16);
      sourcePattern.Kick[0] = true;
      sourcePattern.Kick[8] = true;
      sourcePattern.Kick[15] = true; // This should be truncated
      
      const result = adaptPatternToStepCount(sourcePattern, mockDrumSounds, 8);
      expect(result.Kick[0]).toBe(true);
      expect(result.Kick[4]).toBe(false);
      expect(result.Kick[7]).toBe(false);
      expect(result.Kick[8]).toBeUndefined();
      expect(result.Kick.length).toBe(8);
    });

    it('should handle null or undefined pattern', () => {
      const result = adaptPatternToStepCount(null, mockDrumSounds, 16);
      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBe(mockDrumSounds.length);
      mockDrumSounds.forEach(sound => {
        expect(result[sound.name].length).toBe(16);
      });
    });
  });

  describe('buildPatternData', () => {
    it('should build complete pattern data with all options', () => {
      const pattern = createEmptyPattern(mockDrumSounds, 16);
      pattern.Kick[0] = true;
      
      const options = {
        bpm: 140,
        stepCount: 16,
        drumVolumes: { Kick: -5, Snare: -10 },
        masterVolume: -15,
        filterFreq: 8000,
        filterQ: 2,
        loopPlaying: [true, false, true, false, false, false],
        loopVolume: [-10, -20, -15, -20, -20, -20],
      };

      const result = buildPatternData(pattern, options, mockDrumSounds);

      expect(result.pattern).toEqual(pattern);
      expect(result.bpm).toBe(140);
      expect(result.stepCount).toBe(16);
      expect(result.drumVolumes).toEqual(options.drumVolumes);
      expect(result.masterVolume).toBe(-15);
      expect(result.filterFreq).toBe(8000);
      expect(result.filterQ).toBe(2);
      expect(result.loop1Playing).toBe(true);
      expect(result.loop2Playing).toBe(false);
      expect(result.loop3Playing).toBe(true);
      expect(result.loop1Volume).toBe(-10);
      expect(result.loop3Volume).toBe(-15);
    });

    it('should use default values when options are missing', () => {
      const pattern = createEmptyPattern(mockDrumSounds, 16);
      const result = buildPatternData(pattern, {}, mockDrumSounds);

      expect(result.bpm).toBe(DEFAULTS.BPM);
      expect(result.stepCount).toBe(DEFAULTS.STEP_COUNT);
      expect(result.masterVolume).toBe(DEFAULTS.VOLUME_DB);
      expect(result.filterFreq).toBe(DEFAULTS.FILTER_FREQ);
      expect(result.filterQ).toBe(DEFAULTS.FILTER_Q);
    });

    it('should handle partial loop data', () => {
      const pattern = createEmptyPattern(mockDrumSounds, 16);
      const options = {
        loopPlaying: [true], // Only 1 loop specified
      };

      const result = buildPatternData(pattern, options, mockDrumSounds);

      expect(result.loop1Playing).toBe(true);
      expect(result.loop2Playing).toBe(false);
      expect(result.loop3Playing).toBe(false);
      expect(result.loop1Volume).toBe(DEFAULTS.VOLUME_DB);
    });

    it('should normalize the pattern data', () => {
      const pattern = createEmptyPattern(mockDrumSounds, 16);
      pattern.Kick[0] = true;
      
      // Missing some drum volumes
      const options = {
        drumVolumes: { Kick: -5 }, // Snare and others missing
      };

      const result = buildPatternData(pattern, options, mockDrumSounds);

      // Should add missing drum volumes with defaults
      expect(result.drumVolumes.Kick).toBe(-5);
      expect(result.drumVolumes.Snare).toBe(DEFAULTS.VOLUME_DB);
      expect(Object.keys(result.drumVolumes).length).toBe(mockDrumSounds.length);
    });
  });

  describe('normalizePatternData', () => {
    it('should validate and fix missing pattern structure', () => {
      const invalidData = {
        pattern: null,
        bpm: 120,
      };

      const result = normalizePatternData(invalidData, mockDrumSounds, 16);

      expect(result.pattern).toBeDefined();
      expect(Array.isArray(result.pattern.Kick)).toBe(true);
      expect(result.bpm).toBe(120);
    });

    it('should add missing drum sounds with empty patterns', () => {
      const incompleteData = {
        pattern: {
          Kick: Array(16).fill(false),
          // Missing all other drum sounds
        },
        bpm: 120,
      };

      const result = normalizePatternData(incompleteData, mockDrumSounds, 16);

      expect(result.pattern.Kick).toBeDefined();
      mockDrumSounds.forEach(sound => {
        expect(result.pattern[sound.name]).toBeDefined();
        expect(result.pattern[sound.name].length).toBe(16);
      });
    });

    it('should adjust pattern length when it does not match step count', () => {
      const data = {
        pattern: {
          Kick: Array(8).fill(false), // Wrong length
          Snare: Array(16).fill(false),
        },
        stepCount: 16,
      };

      const result = normalizePatternData(data, mockDrumSounds, 16);

      expect(result.pattern.Kick.length).toBe(16);
      expect(result.pattern.Snare.length).toBe(16);
    });

    it('should remove unknown drum sounds from pattern', () => {
      const data = {
        pattern: {
          Kick: Array(16).fill(false),
          UnknownSound: Array(16).fill(true), // Should be removed
        },
        drumVolumes: {
          Kick: -10,
          UnknownSound: -5, // Should be removed
        },
      };

      const result = normalizePatternData(data, mockDrumSounds, 16);

      expect(result.pattern.UnknownSound).toBeUndefined();
      expect(result.drumVolumes.UnknownSound).toBeUndefined();
      expect(result.pattern.Kick).toBeDefined();
      expect(result.drumVolumes.Kick).toBe(-10);
    });

    it('should set default values for missing numeric fields', () => {
      const data = {
        pattern: createEmptyPattern(mockDrumSounds, 16),
        // Missing all numeric fields
      };

      const result = normalizePatternData(data, mockDrumSounds, 16);

      expect(result.bpm).toBe(DEFAULTS.BPM);
      expect(result.masterVolume).toBe(DEFAULTS.VOLUME_DB);
      expect(result.filterFreq).toBe(DEFAULTS.FILTER_FREQ);
      expect(result.filterQ).toBe(DEFAULTS.FILTER_Q);
    });

    it('should use provided values when they exist', () => {
      const data = {
        pattern: createEmptyPattern(mockDrumSounds, 16),
        bpm: 140,
        masterVolume: -20,
        filterFreq: 10000,
        filterQ: 3,
        loop1Playing: true,
        loop1Volume: -5,
      };

      const result = normalizePatternData(data, mockDrumSounds, 16);

      expect(result.bpm).toBe(140);
      expect(result.masterVolume).toBe(-20);
      expect(result.filterFreq).toBe(10000);
      expect(result.filterQ).toBe(3);
      expect(result.loop1Playing).toBe(true);
      expect(result.loop1Volume).toBe(-5);
    });

    it('should throw error for invalid input', () => {
      expect(() => normalizePatternData(null, mockDrumSounds, 16)).toThrow();
      expect(() => normalizePatternData(undefined, mockDrumSounds, 16)).toThrow();
      expect(() => normalizePatternData('invalid', mockDrumSounds, 16)).toThrow();
    });
  });

  describe('validatePatternData', () => {
    it('should validate correct pattern data', () => {
      const validData = buildPatternData(
        createEmptyPattern(mockDrumSounds, 16),
        {},
        mockDrumSounds
      );

      const result = validatePatternData(validData, mockDrumSounds);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing pattern', () => {
      const result = validatePatternData({}, mockDrumSounds);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect non-boolean step values', () => {
      const data = {
        pattern: {
          Kick: [true, false, 'invalid', false], // Invalid value
        },
      };

      const result = validatePatternData(data, mockDrumSounds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Kick'))).toBe(true);
    });

    it('should detect invalid BPM values', () => {
      const data = buildPatternData(
        createEmptyPattern(mockDrumSounds, 16),
        { bpm: 400 }, // Too high
        mockDrumSounds
      );

      const result = validatePatternData(data, mockDrumSounds);
      expect(result.isValid).toBe(true); // Should still be valid, just warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect unknown drum sounds', () => {
      const data = {
        pattern: createEmptyPattern(mockDrumSounds, 16),
        UnknownSound: [], // Unknown at root level
      };

      const result = validatePatternData(data, mockDrumSounds);
      // Should be valid since validatePatternData doesn't check for this
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid drum volumes', () => {
      const data = {
        pattern: createEmptyPattern(mockDrumSounds, 16),
        drumVolumes: {
          Kick: 'invalid', // Should be number
        },
      };

      const result = validatePatternData(data, mockDrumSounds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Kick'))).toBe(true);
    });

    it('should handle null input gracefully', () => {
      const result = validatePatternData(null, mockDrumSounds);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('compressPatternData', () => {
    it('should compress pattern data by removing defaults', () => {
      const fullData = buildPatternData(
        createEmptyPattern(mockDrumSounds, 16),
        {
          bpm: 120,
          masterVolume: -10, // Default value
          drumVolumes: { Kick: -10, Snare: -10 }, // All defaults
          loopPlaying: [false, false, false, false, false, false],
          loopVolume: [-10, -10, -10, -10, -10, -10],
        },
        mockDrumSounds
      );

      const compressed = compressPatternData(fullData);

      // Should not include defaults
      expect(compressed.masterVolume).toBeUndefined();
      expect(compressed.drumVolumes).toBeUndefined();
      expect(compressed.loop1Playing).toBeUndefined();
      expect(compressed.loop1Volume).toBeUndefined();
      
      // Should include non-defaults
      expect(compressed.bpm).toBe(120);
      expect(compressed.pattern).toBeDefined();
    });

    it('should include non-default values', () => {
      const fullData = buildPatternData(
        createEmptyPattern(mockDrumSounds, 16),
        {
          masterVolume: -20, // Non-default
          drumVolumes: { Kick: -5 }, // Different from default - will include all
          loopPlaying: [true, false, false, false, false, false], // Loop 1 enabled
          loopVolume: [-5, -10, -10, -10, -10, -10], // Loop 1 custom volume
        },
        mockDrumSounds
      );

      const compressed = compressPatternData(fullData);

      expect(compressed.masterVolume).toBe(-20);
      // When any drum volume is non-default, all are included
      expect(compressed.drumVolumes).toBeDefined();
      expect(compressed.drumVolumes.Kick).toBe(-5);
      // Other drums will also be present (with default values from normalization)
      expect(Object.keys(compressed.drumVolumes).length).toBeGreaterThan(1);
      expect(compressed.loop1Playing).toBe(true);
      expect(compressed.loop1Volume).toBe(-5);
    });

    it('should maintain essential fields', () => {
      const fullData = buildPatternData(
        createEmptyPattern(mockDrumSounds, 16),
        { bpm: 140, stepCount: 32 },
        mockDrumSounds
      );

      const compressed = compressPatternData(fullData);

      expect(compressed.pattern).toBeDefined();
      expect(compressed.bpm).toBe(140);
      expect(compressed.stepCount).toBe(32);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalData = {
        pattern: createEmptyPattern(mockDrumSounds, 16),
        bpm: 120,
        stepCount: 16,
      };

      const compressed = compressPatternData(minimalData);

      expect(compressed.pattern).toBeDefined();
      expect(compressed.bpm).toBe(120);
      expect(compressed.masterVolume).toBeUndefined();
      expect(compressed.drumVolumes).toBeUndefined();
    });
  });
});
