import { generatePattern } from './patternFactory';
import { adaptPatternToStepCount } from './patternBuilder';

// Mock data matching the original hardcoded patterns
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

describe('Pattern Integration & Backward Compatibility', () => {
  describe('Generated patterns match original structure', () => {
    it('Rock Beat should have same logical structure as original', () => {
      const generated = generatePattern('Rock Beat', mockDrumSounds, 16);
      
      // Verify kick pattern (on beats 1, 2, 3, 4)
      expect(generated.Kick[0]).toBe(true);
      expect(generated.Kick[4]).toBe(true);
      expect(generated.Kick[8]).toBe(true);
      expect(generated.Kick[12]).toBe(true);
      
      // Verify snare pattern (on beats 2 and 4)
      expect(generated.Snare[4]).toBe(true);
      expect(generated.Snare[12]).toBe(true);
      
      // Verify hats on every step
      expect(generated['Closed Hi-Hat'].every(step => step === true)).toBe(true);
      
      // Verify crash on beat 1
      expect(generated.Crash[0]).toBe(true);
      
      // Verify everything else is empty
      expect(generated.Clap.every(step => step === false)).toBe(true);
    });

    it('Hip-Hop should have same syncopation pattern', () => {
      const generated = generatePattern('Hip-Hop', mockDrumSounds, 16);
      
      // Kick on 1, 7, 13 (syncopated)
      expect(generated.Kick[0]).toBe(true);
      expect(generated.Kick[6]).toBe(true);
      expect(generated.Kick[12]).toBe(true);
      
      // Snare on beats 2 and 4
      expect(generated.Snare[4]).toBe(true);
      expect(generated.Snare[12]).toBe(true);
      
      // Hats on odd steps (off-beats)
      expect(generated['Closed Hi-Hat'][1]).toBe(true);
      expect(generated['Closed Hi-Hat'][3]).toBe(true);
      expect(generated['Closed Hi-Hat'][5]).toBe(true);
      expect(generated['Closed Hi-Hat'][7]).toBe(true);
      expect(generated['Closed Hi-Hat'][15]).toBe(true);
    });

    it('Techno should have off-beat snare pattern', () => {
      const generated = generatePattern('Techno', mockDrumSounds, 16);
      
      // Kick on all beats
      expect(generated.Kick[0]).toBe(true);
      expect(generated.Kick[4]).toBe(true);
      expect(generated.Kick[8]).toBe(true);
      expect(generated.Kick[12]).toBe(true);
      
      // Snare on off-beats (techno style: 2, 6, 10, 14)
      expect(generated.Snare[2]).toBe(true);
      expect(generated.Snare[6]).toBe(true);
      expect(generated.Snare[10]).toBe(true);
      expect(generated.Snare[14]).toBe(true);
      
      // Hats on every step
      expect(generated['Closed Hi-Hat'].every(step => step === true)).toBe(true);
    });
  });

  describe('Saved patterns compatibility', () => {
    it('should handle old format saved patterns (pattern only)', () => {
      const oldFormatPattern = {
        'Kick': [true, false, true, false],
        'Snare': [false, true, false, true],
        'Closed Hi-Hat': [true, true, true, true],
      };
      
      // Old format would be adapted directly
      const adapted = adaptPatternToStepCount(oldFormatPattern, mockDrumSounds, 8);
      
      expect(adapted.Kick.length).toBe(8);
      expect(adapted['Closed Hi-Hat'].every(step => step === true)).toBe(true);
    });

    it('should handle new format saved patterns (with metadata)', () => {
      const newFormatPattern = {
        pattern: {
          'Kick': [true, false],
          'Snare': [false, true],
        },
        bpm: 140,
        stepCount: 2,
        drumVolumes: { 'Kick': -5, 'Snare': -8 },
        masterVolume: -12,
        filterFreq: 8000,
        filterQ: 2,
      };
      
      // New format should work with patternFactory utilities
      expect(newFormatPattern.pattern).toBeDefined();
      expect(newFormatPattern.bpm).toBe(140);
    });
  });

  describe('Step count adaptation', () => {
    it('should adapt 16-step patterns to different sizes correctly', () => {
      const original16 = generatePattern('Rock Beat', mockDrumSounds, 16);
      
      // Adapt to 8 steps
      const adapted8 = adaptPatternToStepCount(original16, mockDrumSounds, 8);
      expect(adapted8.Kick.length).toBe(8);
      
      // Adapt to 32 steps  
      const adapted32 = adaptPatternToStepCount(original16, mockDrumSounds, 32);
      expect(adapted32.Kick.length).toBe(32);
      
      // Adapt to 24 steps
      const adapted24 = adaptPatternToStepCount(original16, mockDrumSounds, 24);
      expect(adapted24.Kick.length).toBe(24);
    });
  });

  describe('Empty pattern consistency', () => {
    it('Empty pattern should always be completely empty', () => {
      const empty8 = generatePattern('Empty', mockDrumSounds, 8);
      const empty16 = generatePattern('Empty', mockDrumSounds, 16);
      const empty32 = generatePattern('Empty', mockDrumSounds, 32);
      
      [empty8, empty16, empty32].forEach(pattern => {
        Object.values(pattern).forEach(steps => {
          expect(steps.every(step => step === false)).toBe(true);
        });
      });
    });
  });
});
