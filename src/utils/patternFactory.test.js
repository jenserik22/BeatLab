import {
  generatePattern,
  generateAllPatterns,
  createCustomPattern,
  scalePattern,
  getPatternNames,
  getPredefinedPatterns,
} from './patternFactory';
import { createEmptyPattern } from './patternBuilder';

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

describe('patternFactory', () => {
  describe('getPatternNames', () => {
    it('should return available pattern names', () => {
      const names = getPatternNames();
      expect(names).toContain('Empty');
      expect(names).toContain('Rock Beat');
      expect(names).toContain('Hip-Hop');
      expect(names).toContain('Techno');
      expect(names).toContain('Breakbeat');
      expect(names.length).toBeGreaterThan(4);
    });
  });

  describe('generatePattern', () => {
    it('should generate Empty pattern correctly', () => {
      const pattern = generatePattern('Empty', mockDrumSounds, 16);
      
      expect(pattern).toBeDefined();
      mockDrumSounds.forEach(sound => {
        expect(pattern[sound.name]).toBeDefined();
        expect(pattern[sound.name].every(step => step === false)).toBe(true);
      });
    });

    it('should generate Rock Beat pattern with correct structure', () => {
      const pattern = generatePattern('Rock Beat', mockDrumSounds, 16);
      
      expect(pattern).toBeDefined();
      expect(pattern.Kick[0]).toBe(true); // Kick on beat 1
      expect(pattern.Kick[4]).toBe(true); // Kick on beat 2
      expect(pattern.Kick[8]).toBe(true); // Kick on beat 3
      expect(pattern.Kick[12]).toBe(true); // Kick on beat 4
      expect(pattern.Snare[4]).toBe(true); // Snare on beat 2
      expect(pattern.Snare[12]).toBe(true); // Snare on beat 4
      expect(pattern['Closed Hi-Hat'].every(step => step === true)).toBe(true); // Hats on all steps
      expect(pattern.Crash[0]).toBe(true); // Crash on beat 1
    });

    it('should generate Hip-Hop pattern with correct syncopation', () => {
      const pattern = generatePattern('Hip-Hop', mockDrumSounds, 16);
      
      expect(pattern).toBeDefined();
      expect(pattern.Kick[0]).toBe(true);
      expect(pattern.Kick[6]).toBe(true);
      expect(pattern.Kick[12]).toBe(true);
      expect(pattern.Snare[4]).toBe(true);
      expect(pattern.Snare[12]).toBe(true);
      // Hats should be on odd steps (1, 3, 5, 7, 9, 11, 13, 15)
      expect(pattern['Closed Hi-Hat'][1]).toBe(true);
      expect(pattern['Closed Hi-Hat'][3]).toBe(true);
      expect(pattern['Closed Hi-Hat'][5]).toBe(true);
    });

    it('should generate Techno pattern correctly', () => {
      const pattern = generatePattern('Techno', mockDrumSounds, 16);
      
      expect(pattern).toBeDefined();
      // Kick on all 4 beats
      expect(pattern.Kick[0]).toBe(true);
      expect(pattern.Kick[4]).toBe(true);
      expect(pattern.Kick[8]).toBe(true);
      expect(pattern.Kick[12]).toBe(true);
      // Snare on off-beats for techno feel
      expect(pattern.Snare[2]).toBe(true);
      expect(pattern.Snare[6]).toBe(true);
      expect(pattern.Snare[10]).toBe(true);
      expect(pattern.Snare[14]).toBe(true);
      // Hats on every step
      expect(pattern['Closed Hi-Hat'].every(step => step === true)).toBe(true);
    });

    it('should generate Breakbeat pattern correctly', () => {
      const pattern = generatePattern('Breakbeat', mockDrumSounds, 16);
      
      expect(pattern).toBeDefined();
      // Check for complex syncopation
      expect(pattern['Closed Hi-Hat'][1]).toBe(true);
      expect(pattern['Closed Hi-Hat'][3]).toBe(true);
      expect(pattern['Closed Hi-Hat'][5]).toBe(true);
      // Should have some kicks on unexpected beats
      expect(pattern.Kick[0]).toBe(true);
      expect(pattern.Kick[6]).toBe(true);
      expect(pattern.Kick[9]).toBe(true);
    });

    it('should handle different step counts', () => {
      const pattern8 = generatePattern('Rock Beat', mockDrumSounds, 8);
      const pattern32 = generatePattern('Rock Beat', mockDrumSounds, 32);
      
      expect(pattern8.Kick.length).toBe(8);
      expect(pattern32.Kick.length).toBe(32);
      
      // Should adapt to fit new step count
      expect(pattern8.Kick[0]).toBe(true);
      expect(pattern8.Kick[2]).toBe(true);
      expect(pattern8.Kick[4]).toBe(true);
      expect(pattern8.Kick[6]).toBe(true);
    });

    it('should return Empty pattern for unknown pattern names', () => {
      const pattern = generatePattern('Unknown Pattern', mockDrumSounds, 16);
      
      expect(pattern).toBeDefined();
      mockDrumSounds.forEach(sound => {
        expect(pattern[sound.name]).toBeDefined();
        expect(pattern[sound.name].every(step => step === false)).toBe(true);
      });
    });

    it('should handle missing drum sounds gracefully', () => {
      const incompleteDrums = [{ name: 'Kick', note: 'C2', type: 'membrane' }];
      const pattern = generatePattern('Rock Beat', incompleteDrums, 8);
      
      expect(pattern).toBeDefined();
      expect(pattern.Kick).toBeDefined();
      // Should still work even with incomplete drum sounds
    });
  });

  describe('generateAllPatterns', () => {
    it('should generate all pattern types', () => {
      const patterns = generateAllPatterns(mockDrumSounds, 16);
      
      expect(patterns).toBeDefined();
      expect(patterns['Empty']).toBeDefined();
      expect(patterns['Rock Beat']).toBeDefined();
      expect(patterns['Hip-Hop']).toBeDefined();
      expect(patterns['Techno']).toBeDefined();
      expect(patterns['Breakbeat']).toBeDefined();
    });

    it('should maintain consistency across patterns', () => {
      const patterns = generateAllPatterns(mockDrumSounds, 16);
      
      // All patterns should have the same drum sound keys
      const patternKeys = Object.keys(patterns['Rock Beat']);
      Object.values(patterns).forEach(pattern => {
        expect(Object.keys(pattern)).toEqual(patternKeys);
      });
    });

    it('should use correct step count for all patterns', () => {
      const stepCount = 24;
      const patterns = generateAllPatterns(mockDrumSounds, stepCount);
      
      Object.values(patterns).forEach(pattern => {
        mockDrumSounds.forEach(sound => {
          expect(pattern[sound.name].length).toBe(stepCount);
        });
      });
    });
  });

  describe('createCustomPattern', () => {
    it('should create pattern from step indices array', () => {
      const options = {
        steps: {
          'Kick': [0, 4, 8, 12],
          'Snare': [4, 12],
          'Closed Hi-Hat': 'all',
        }
      };
      
      const pattern = createCustomPattern(options, mockDrumSounds, 16);
      
      expect(pattern.Kick[0]).toBe(true);
      expect(pattern.Kick[4]).toBe(true);
      expect(pattern.Kick[8]).toBe(true);
      expect(pattern.Kick[12]).toBe(true);
      expect(pattern.Snare[4]).toBe(true);
      expect(pattern.Snare[12]).toBe(true);
      expect(pattern['Closed Hi-Hat'].every(step => step === true)).toBe(true);
    });

    it('should handle string notation', () => {
      const options = {
        steps: {
          'Kick': [0, 4, 8, 12],
          'Snare': '....x...x...x...', // 16 characters, x marks active steps
        }
      };
      
      const pattern = createCustomPattern(options, mockDrumSounds, 16);
      
      // Only steps with 'x' should be true
      expect(pattern.Snare[0]).toBe(false); // '.' = off
      expect(pattern.Snare[1]).toBe(false);
      expect(pattern.Snare[2]).toBe(false);
      expect(pattern.Snare[3]).toBe(false);
      expect(pattern.Snare[4]).toBe(true); // 'x' = on
      expect(pattern.Snare[12]).toBe(true);
    });

    it('should handle missing drum sounds gracefully', () => {
      const options = {
        steps: {
          'Kick': [0, 2, 4],
          'Unknown Drum': [1, 3, 5], // This should be ignored
        }
      };
      
      const pattern = createCustomPattern(options, mockDrumSounds, 8);
      
      expect(pattern.Kick[0]).toBe(true);
      expect(pattern.Kick[2]).toBe(true);
      expect(pattern.Kick[4]).toBe(true);
      expect(pattern['Unknown Drum']).toBeUndefined();
    });

    it('should normalize step indices to pattern length', () => {
      const options = {
        steps: {
          'Kick': [0, 8, 16, 24], // Will wrap around
        }
      };
      
      const pattern = createCustomPattern(options, mockDrumSounds, 8);
      
      expect(pattern.Kick[0]).toBe(true);
      expect(pattern.Kick[8 % 8]).toBe(true); // 8 % 8 = 0
      expect(pattern.Kick[16 % 8]).toBe(true); // 16 % 8 = 0
      expect(pattern.Kick[24 % 8]).toBe(true); // 24 % 8 = 0
    });

    it('should handle empty step definitions', () => {
      const options = {
        steps: {}
      };
      
      const pattern = createCustomPattern(options, mockDrumSounds, 8);
      
      mockDrumSounds.forEach(sound => {
        expect(pattern[sound.name].every(step => step === false)).toBe(true);
      });
    });
  });

  describe('scalePattern', () => {
    it('should scale pattern from 16 to 8 steps', () => {
      const sourcePattern = createEmptyPattern(mockDrumSounds, 16);
      sourcePattern.Kick[0] = true;
      sourcePattern.Kick[8] = true;
      
      const scaled = scalePattern(sourcePattern, 16, 8);
      
      expect(scaled.Kick.length).toBe(8);
      expect(scaled.Kick[0]).toBe(true); // 0 * (8/16) = 0
      expect(scaled.Kick[4]).toBe(true); // 8 * (8/16) = 4
    });

    it('should scale pattern from 8 to 16 steps', () => {
      const sourcePattern = createEmptyPattern(mockDrumSounds, 8);
      sourcePattern.Kick[0] = true;
      sourcePattern.Kick[2] = true;
      sourcePattern.Kick[4] = true;
      sourcePattern.Kick[6] = true;
      
      const scaled = scalePattern(sourcePattern, 8, 16);
      
      expect(scaled.Kick.length).toBe(16);
      expect(scaled.Kick[0]).toBe(true); // 0 * (16/8) = 0
      expect(scaled.Kick[4]).toBe(true); // 2 * (16/8) = 4
      expect(scaled.Kick[8]).toBe(true); // 4 * (16/8) = 8
      expect(scaled.Kick[12]).toBe(true); // 6 * (16/8) = 12
    });

    it('should handle scaling with fractional step indices', () => {
      const sourcePattern = createEmptyPattern(mockDrumSounds, 12);
      sourcePattern.Kick[0] = true;
      sourcePattern.Kick[3] = true;
      sourcePattern.Kick[6] = true;
      
      const scaled = scalePattern(sourcePattern, 12, 8);
      
      expect(scaled.Kick.length).toBe(8);
      // Steps should be floored
      expect(scaled.Kick[Math.floor(0 * (8/12))]).toBe(true);
      expect(scaled.Kick[Math.floor(3 * (8/12))]).toBe(true);
      expect(scaled.Kick[Math.floor(6 * (8/12))]).toBe(true);
    });

    it('should preserve all drum sounds when scaling', () => {
      const sourcePattern = createEmptyPattern(mockDrumSounds, 16);
      sourcePattern.Kick[0] = true;
      sourcePattern.Snare[4] = true;
      sourcePattern['Closed Hi-Hat'][2] = true;
      
      const scaled = scalePattern(sourcePattern, 16, 8);
      
      expect(Object.keys(scaled).length).toBe(Object.keys(sourcePattern).length);
      expect(scaled.Kick[0]).toBe(true);
      expect(scaled.Snare[2]).toBe(true); // 4 * (8/16) = 2
      expect(scaled['Closed Hi-Hat'][1]).toBe(true); // 2 * (8/16) = 1
    });
  });

  describe('getPredefinedPatterns', () => {
    it('should provide backward compatibility', () => {
      const patterns = getPredefinedPatterns(mockDrumSounds, 16);
      
      expect(patterns).toBeDefined();
      expect(patterns['Rock Beat']).toBeDefined();
      expect(patterns['Hip-Hop']).toBeDefined();
    });

    it('should maintain compatibility with generateAllPatterns', () => {
      const patterns1 = getPredefinedPatterns(mockDrumSounds, 16);
      const patterns2 = generateAllPatterns(mockDrumSounds, 16);
      
      expect(Object.keys(patterns1)).toEqual(Object.keys(patterns2));
    });
  });
});
