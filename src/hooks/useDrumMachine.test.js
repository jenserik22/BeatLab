import { renderHook, act } from '@testing-library/react';
import { useDrumMachine } from './useDrumMachine';
import { KITS_CONFIG } from '../constants/kitsConfig';
import { DEFAULTS } from '../constants/config';

// Mock Tone.js and other dependencies
jest.mock('tone', () => ({
  __esModule: true,
  ...jest.requireActual('tone'), // Keep actual Tone.js for constants etc.
  Sequence: jest.fn().mockImplementation(function (callback, events, subdivision) {
    this.start = jest.fn().mockReturnThis();
    this.stop = jest.fn().mockReturnThis();
    this.dispose = jest.fn();
    this.callback = callback;
    this.events = events;
    this.subdivision = subdivision;
  }),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
    bpm: { value: 120 },
    swing: 0,
    loop: true,
    loopEnd: '4m',
    state: 'stopped',
  },
  Volume: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    volume: { value: 0 },
  })),
  Filter: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    frequency: { value: 20000 },
    Q: { value: 1 },
  })),
  MembraneSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    triggerAttackRelease: jest.fn(),
  })),
  Player: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  Loop: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
  Analyser: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
  })),
}));

const mockDrumSounds = [
  { name: 'Kick', note: 'C1', type: 'membrane' },
  { name: 'Snare', note: 'D1', type: 'noise' },
];

const testKit = {
  id: 'test-kit',
  name: 'Test Kit',
  description: 'A simple kit for testing purposes with no effects.',
  defaultBpm: 150,
  defaultSwing: 0.25,
  drums: {
    'Kick': {
      type: 'MembraneSynth',
      options: {},
      effects: []
    },
    'Snare': {
      type: 'NoiseSynth',
      options: {},
      effects: []
    }
  }
};

describe('useDrumMachine', () => {
  it('should load a new kit and update BPM and swing', () => {
    const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
    const initialBpm = result.current.bpm;

    expect(initialBpm).not.toBe(testKit.defaultBpm);

    act(() => {
      result.current.loadKit(testKit);
    });

    expect(result.current.bpm).toBe(testKit.defaultBpm);
    expect(result.current.swing).toBe(testKit.defaultSwing);
    expect(result.current.currentKit.id).toBe('test-kit');
  });
});
