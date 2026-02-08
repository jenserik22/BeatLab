import { describe, it, expect } from '@jest/globals';

describe('Audio Export Duration Calculations', () => {
  // Helper function to calculate pattern length
  const calculatePatternLengthInSeconds = (bpm, stepCount) => {
    // Each step is a 16th note (1/4 of a beat)
    // So total beats = stepCount / 4
    const totalBeats = stepCount / 4;
    return (totalBeats * 60) / bpm;
  };

  describe('Pattern Length Calculations', () => {
    it('should calculate correct pattern length at 120 BPM', () => {
      const bpm = 120;
      const stepCount = 16;
      const expectedLength = (4 * 60) / 120; // 4 beats * 60 seconds / 120 BPM = 2 seconds
      
      expect(calculatePatternLengthInSeconds(bpm, stepCount)).toBe(expectedLength);
    });

    it('should calculate correct pattern length at 60 BPM', () => {
      const bpm = 60;
      const stepCount = 16;
      const expectedLength = (4 * 60) / 60; // 4 beats * 60 seconds / 60 BPM = 4 seconds
      
      expect(calculatePatternLengthInSeconds(bpm, stepCount)).toBe(expectedLength);
    });

    it('should calculate correct pattern length at 180 BPM', () => {
      const bpm = 180;
      const stepCount = 16;
      // 4 beats * 60 seconds / 180 BPM = 1.333 seconds
      
      expect(calculatePatternLengthInSeconds(bpm, stepCount)).toBeCloseTo(1.333, 2);
    });

    it('should handle different step counts correctly', () => {
      const bpm = 120;
      
      // 8 steps = 2 beats
      expect(calculatePatternLengthInSeconds(bpm, 8)).toBe((2 * 60) / 120);
      
      // 16 steps = 4 beats
      expect(calculatePatternLengthInSeconds(bpm, 16)).toBe((4 * 60) / 120);
      
      // 32 steps = 8 beats
      expect(calculatePatternLengthInSeconds(bpm, 32)).toBe((8 * 60) / 120);
    });
  });

  describe('Round-based Duration', () => {
    it('should calculate duration correctly for different round counts', () => {
      const bpm = 120;
      const stepCount = 16;
      const patternLength = calculatePatternLengthInSeconds(bpm, stepCount);
      
      expect(patternLength * 1).toBeCloseTo(2.0, 10);
      expect(patternLength * 2).toBeCloseTo(4.0, 10);
      expect(patternLength * 4).toBeCloseTo(8.0, 10);
    });
  });

  describe('Beat timing calculations', () => {
    it('should calculate correct timing for each 16th note', () => {
      const bpm = 120;
      const beatDuration = 60 / bpm; // Duration of one beat in seconds
      const sixteenthNoteDuration = beatDuration / 4; // 16th note = 1/4 beat
      
      expect(sixteenthNoteDuration).toBeCloseTo(0.125, 10); // 0.125 seconds at 120 BPM
      
      // Test multiple steps
      expect(sixteenthNoteDuration * 0).toBe(0);
      expect(sixteenthNoteDuration * 1).toBeCloseTo(0.125, 10);
      expect(sixteenthNoteDuration * 2).toBeCloseTo(0.25, 10);
      expect(sixteenthNoteDuration * 15).toBeCloseTo(1.875, 10);
    });

    it('should adjust timing correctly for different BPMs', () => {
      const bpm60 = 60;
      const bpm120 = 120;
      const bpm180 = 180;
      
      const beat60 = 60 / bpm60;
      const beat120 = 60 / bpm120;
      const beat180 = 60 / bpm180;
      
      expect(beat60).toBe(1.0);    // 1 second per beat at 60 BPM
      expect(beat120).toBe(0.5);   // 0.5 seconds per beat at 120 BPM
      expect(beat180).toBeCloseTo(0.333, 2); // ~0.333 seconds per beat at 180 BPM
      
      // 16th notes should be 1/4 of beat duration
      expect(beat60 / 4).toBe(0.25);
      expect(beat120 / 4).toBe(0.125);
      expect(beat180 / 4).toBeCloseTo(0.0833, 2);
    });
  });
});
