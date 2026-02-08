import { renderHook, act } from '@testing-library/react';
import { useDrumMachine } from './useDrumMachine';

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

  // User loop tests
  describe('user loops', () => {
    it('should initialize with empty userLoops array', () => {
      const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
      
      expect(result.current.userLoops).toBeDefined();
      expect(Array.isArray(result.current.userLoops)).toBe(true);
      expect(result.current.userLoops).toHaveLength(0);
    });

    it('should add user loop when addUserLoop is called', () => {
      const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
      
      act(() => {
        result.current.addUserLoop();
      });
      
      expect(result.current.userLoops).toHaveLength(1);
      expect(result.current.userLoops[0]).toHaveProperty('id');
      expect(result.current.userLoops[0]).toHaveProperty('url');
      expect(result.current.userLoops[0]).toHaveProperty('playing');
      expect(result.current.userLoops[0]).toHaveProperty('volume');
      expect(result.current.userLoops[0].url).toBeNull();
      expect(result.current.userLoops[0].playing).toBe(false);
    });

    it('should handle user loop file upload', () => {
      const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
      
      // First add a loop
      act(() => {
        result.current.addUserLoop();
      });
      
      const loopId = result.current.userLoops[0].id;
      
      // Mock file
      const mockFile = new File(['wav-data'], 'test.wav', { type: 'audio/wav' });
      
      act(() => {
        result.current.handleUserLoopFileUpload(loopId, mockFile);
      });
      
      expect(result.current.userLoops[0].url).toBeTruthy();
      expect(result.current.userLoops[0].url).toContain('blob:');
    });

    it('should toggle user loop playing state', () => {
      const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
      
      act(() => {
        result.current.addUserLoop();
      });
      
      const loopId = result.current.userLoops[0].id;
      
      // Initially not playing
      expect(result.current.userLoops[0].playing).toBe(false);
      
      act(() => {
        result.current.toggleUserLoop(loopId);
      });
      
      // Should be playing
      expect(result.current.userLoops[0].playing).toBe(true);
      
      act(() => {
        result.current.toggleUserLoop(loopId);
      });
      
      // Should not be playing
      expect(result.current.userLoops[0].playing).toBe(false);
    });

    it('should handle user loop volume change', () => {
      const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
      
      act(() => {
        result.current.addUserLoop();
      });
      
      const loopId = result.current.userLoops[0].id;
      const newVolume = -5;
      
      act(() => {
        result.current.handleUserLoopVolumeChange(loopId, newVolume);
      });
      
      expect(result.current.userLoops[0].volume).toBe(newVolume);
    });

    it('should clear user loop file upload', () => {
      const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
      
      act(() => {
        result.current.addUserLoop();
      });
      
      const loopId = result.current.userLoops[0].id;
      const mockFile = new File(['wav-data'], 'test.wav', { type: 'audio/wav' });
      
      // Upload file
      act(() => {
        result.current.handleUserLoopFileUpload(loopId, mockFile);
      });
      
      const uploadedUrl = result.current.userLoops[0].url;
      expect(uploadedUrl).toBeTruthy();
      
      // Clear it
      act(() => {
        result.current.handleClearUserLoop(loopId);
      });
      
      expect(result.current.userLoops[0].url).toBeNull();
    });

    it('should enforce MAX_USER_LOOPS limit', () => {
      const { result } = renderHook(() => useDrumMachine(mockDrumSounds));
      
      // Add loops up to limit
      for (let i = 0; i < 8; i++) {
        act(() => {
          result.current.addUserLoop();
        });
      }
      
      expect(result.current.userLoops).toHaveLength(8);
      
      // Try to add one more
      act(() => {
        result.current.addUserLoop();
      });
      
      // Should still be 8
      expect(result.current.userLoops).toHaveLength(8);
    });
  });
});
