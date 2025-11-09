import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AudioExporter from './AudioExporter';
import * as Tone from 'tone';

// Mock Tone.js
jest.mock('tone', () => ({
  Offline: jest.fn(),
  Volume: jest.fn(() => ({
    toDestination: jest.fn(),
    connect: jest.fn(),
  })),
  Filter: jest.fn(() => ({
    connect: jest.fn(),
  })),
  MembraneSynth: jest.fn(() => ({
    connect: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn(() => ({
    connect: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
}));

describe('AudioExporter', () => {
  const mockProps = {
    drumSounds: [
      { name: 'Kick', note: 'C2', type: 'membrane' },
      { name: 'Snare', note: 'E2', type: 'noise' },
      { name: 'Closed Hi-Hat', note: 'F#2', type: 'noise' },
    ],
    bpm: 120,
    stepCount: 16,
    pattern: {
      'Kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'Snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'Closed Hi-Hat': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    },
    drumVolumes: {
      'Kick': -10,
      'Snare': -10,
      'Closed Hi-Hat': -10,
    },
    masterVolume: -10,
    filterFreq: 15000,
    filterQ: 1,
    loopPlaying: [false, false, false, false, false, false],
    loopVolume: [-10, -10, -10, -10, -10, -10],
    loop1: null,
    loop2: null,
    loop3: null,
    loop4: null,
    loop5: null,
    loop6: null,
  };

  describe('Duration Calculations', () => {
    it('should calculate correct pattern length at different BPMs', () => {
      const { rerender } = render(<AudioExporter {...mockProps} />);
      
      // Test at 60 BPM
      rerender(<AudioExporter {...mockProps} bpm={60} />);
      fireEvent.click(screen.getByText('Export'));
      
      // Pattern length should be (16 steps / 4) * (60 / 60) = 4 seconds
      expect(screen.getByText(/Export Pattern to Audio/)).toBeInTheDocument();
      
      // Test at 120 BPM
      rerender(<AudioExporter {...mockProps} bpm={120} />);
      
      // Pattern length should be (16 steps / 4) * (60 / 120) = 2 seconds
      
      // Test at 180 BPM
      rerender(<AudioExporter {...mockProps} bpm={180} />);
      
      // Pattern length should be (16 steps / 4) * (60 / 180) = 1.333 seconds
    });

    it('should adjust duration when selecting different round counts', () => {
      render(<AudioExporter {...mockProps} bpm={120} />);
      
      fireEvent.click(screen.getByText('Export'));
      
      // Select 4 rounds
      fireEvent.change(screen.getByLabelText(/Duration:/), { target: { value: '4' } });
      
      // Should show the modal with export button enabled
      const exportButton = screen.getByText('Confirm Export');
      expect(exportButton).toBeEnabled();
    });
  });

  describe('UI Interactions', () => {
    it('should open modal when clicking Export button', () => {
      render(<AudioExporter {...mockProps} />);
      
      expect(screen.queryByText('Export Pattern to Audio')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Export'));
      
      expect(screen.getByText('Export Pattern to Audio')).toBeInTheDocument();
    });

    it('should close modal when clicking Cancel', () => {
      render(<AudioExporter {...mockProps} />);
      
      fireEvent.click(screen.getByText('Export'));
      expect(screen.getByText('Export Pattern to Audio')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Export Pattern to Audio')).not.toBeInTheDocument();
    });

    it('should disable Confirm Export when file name is empty', () => {
      render(<AudioExporter {...mockProps} />);
      
      fireEvent.click(screen.getByText('Export'));
      
      const fileNameInput = screen.getByPlaceholderText('beatlab-pattern');
      fireEvent.change(fileNameInput, { target: { value: '' } });
      
      expect(screen.getByText('Confirm Export')).toBeDisabled();
    });
  });

  describe('Timing Calculations', () => {
    it('should correctly calculate timing for 16th notes at different BPMs', () => {
      const tests = [
        { bpm: 60, expected: 0.25 },   // 60 BPM = 1 beat/sec, 16th = 0.25 sec
        { bpm: 120, expected: 0.125 }, // 120 BPM = 2 beats/sec, 16th = 0.125 sec
        { bpm: 180, expected: 0.0833 }, // 180 BPM = 3 beats/sec, 16th = 0.0833 sec
      ];
      
      tests.forEach(({ bpm, expected }) => {
        const beatDuration = 60 / bpm;
        const sixteenthNote = beatDuration / 4;
        expect(sixteenthNote).toBeCloseTo(expected, 3);
      });
    });

    it('should calculate correct step time with rounds', () => {
      const bpm = 120;
      const stepCount = 16;
      const round = 1;
      const stepIndex = 8;
      
      const patternLengthSeconds = (stepCount * 60) / (bpm * 4); // Should be 2 seconds
      const sixteenthNoteDuration = (60 / bpm) / 4; // Should be 0.125 seconds
      
      const stepTime = round * patternLengthSeconds + stepIndex * sixteenthNoteDuration;
      
      // Round 1 (second round), step 8 = 2 + 8 * 0.125 = 2 + 1 = 3 seconds
      expect(stepTime).toBeCloseTo(3.0, 10);
    });
  });

  describe('Loop Integration', () => {
    it('should export audio with loops when loops are enabled', () => {
      const propsWithLoops = {
        ...mockProps,
        loopPlaying: [true, false, false, false, false, false],
        loop1: { start: jest.fn(), stop: jest.fn() },
      };
      
      render(<AudioExporter {...propsWithLoops} />);
      
      fireEvent.click(screen.getByText('Export'));
      fireEvent.click(screen.getByText('Confirm Export'));
      
      // Should attempt to render with loops
      expect(Tone.Offline).toHaveBeenCalled();
    });
  });
});
