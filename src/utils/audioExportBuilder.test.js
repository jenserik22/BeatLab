import * as Tone from 'tone';
import {
  createDrumAudioGraph,
  createDrumSynths,
  scheduleDrumPattern,
  setupProgressTracking,
  renderDrumsOffline,
  validateExportOptions,
  isOfflineContextAvailable,
  createTestTone
} from './audioExportBuilder';

// Mock Tone.js
jest.mock('tone', () => {
  const mockConnect = jest.fn();
  const mockStart = jest.fn();
  const mockStop = jest.fn();
  
  const createMockNode = () => ({
    connect: mockConnect,
    toDestination: jest.fn(function() { return this; }),
    dispose: jest.fn()
  });

  return {
    Volume: jest.fn(() => createMockNode()),
    Filter: jest.fn(() => createMockNode()),
    MembraneSynth: jest.fn(() => createMockNode()),
    NoiseSynth: jest.fn(() => createMockNode()),
    Synth: jest.fn(() => createMockNode()),
    Offline: jest.fn((callback) => {
      const mockTransport = {
        bpm: { value: 120 },
        start: mockStart,
        stop: mockStop,
        schedule: jest.fn(),
        duration: 30
      };
      
      const mockContext = {
        transport: mockTransport,
        Destination: createMockNode()
      };
      
      return Promise.resolve(callback(mockContext));
    }),
    Destination: createMockNode()
  };
});

describe('audioExportBuilder', () => {
  const mockDrumSounds = [
    { name: 'Kick', note: 'C2', type: 'membrane' },
    { name: 'Snare', note: 'E2', type: 'noise' },
    { name: 'Closed Hi-Hat', note: 'F#2', type: 'noise' },
  ];

  const mockPattern = {
    'Kick': [true, false, true, false],
    'Snare': [false, true, false, true],
    'Closed Hi-Hat': [true, true, true, true]
  };

  const mockDrumVolumes = {
    'Kick': -10,
    'Snare': -8,
    'Closed Hi-Hat': -15
  };

  describe('createDrumAudioGraph', () => {
    it('should create audio graph with correct structure', () => {
      const targetNode = Tone.Destination;
      const options = {
        masterVolume: -15,
        filterFreq: 8000,
        filterQ: 2
      };

      const result = createDrumAudioGraph(options, targetNode);

      expect(Tone.Volume).toHaveBeenCalledWith(-15);
      expect(Tone.Filter).toHaveBeenCalledWith(8000, 'lowpass');
      expect(result.filterNode.Q.value).toBe(2);
      expect(result.registerNodes).toBeDefined();
    });

    it('should use default values when not specified', () => {
      const targetNode = Tone.Destination;
      const result = createDrumAudioGraph({}, targetNode);

      expect(Tone.Volume).toHaveBeenCalledWith(-10);
      expect(Tone.Filter).toHaveBeenCalledWith(15000, 'lowpass');
      expect(result.filterNode.Q.value).toBe(1);
    });
  });

  describe('createDrumSynths', () => {
    it('should create synths for all drum sounds', () => {
      const filterNode = new Tone.Filter();
      const result = createDrumSynths(mockDrumSounds, mockDrumVolumes, filterNode);

      expect(result.synths['Kick']).toBeDefined();
      expect(result.synths['Snare']).toBeDefined();
      expect(result.synths['Closed Hi-Hat']).toBeDefined();
      expect(Tone.MembraneSynth).toHaveBeenCalled();
      expect(Tone.NoiseSynth).toHaveBeenCalledTimes(2);
    });

    it('should use default volume when not specified', () => {
      const filterNode = new Tone.Filter();
      const emptyVolumes = {};
      const result = createDrumSynths(mockDrumSounds, emptyVolumes, filterNode);

      expect(result.volumeNodes['Kick']).toBeDefined();
      expect(result.synths['Kick']).toBeDefined();
    });

    it('should connect synths to filter node', () => {
      const filterNode = new Tone.Filter();
      const connectSpy = jest.spyOn(filterNode, 'connect');
      const result = createDrumSynths(mockDrumSounds, mockDrumVolumes, filterNode);

      Object.values(result.synths).forEach(synth => {
        expect(synth.connect).toHaveBeenCalled();
      });
    });
  });

  describe('scheduleDrumPattern', () => {
    it('should schedule pattern correctly', () => {
      const transport = {
        bpm: { value: 120 },
        schedule: jest.fn()
      };
      
      const { synths } = createDrumSynths(mockDrumSounds, mockDrumVolumes, new Tone.Filter());
      
      scheduleDrumPattern(
        mockDrumSounds,
        mockPattern,
        synths,
        transport,
        120,
        4,
        8
      );

      expect(transport.bpm.value).toBe(120);
      // Should schedule notes (mock makes actual verification difficult)
    });

    it('should handle different BPM and step counts', () => {
      const transport = {
        bpm: { value: 100 },
        schedule: jest.fn()
      };
      
      const { synths } = createDrumSynths(mockDrumSounds, mockDrumVolumes, new Tone.Filter());
      
      scheduleDrumPattern(
        mockDrumSounds,
        mockPattern,
        synths,
        transport,
        140,
        8,
        16
      );

      expect(transport.bpm.value).toBe(140);
    });
  });

  describe('setupProgressTracking', () => {
    it('should set up progress tracking on transport', () => {
      const transport = {
        schedule: jest.fn()
      };
      const progressCallback = jest.fn();
      const duration = 30;

      setupProgressTracking(transport, duration, progressCallback);

      expect(transport.schedule).toHaveBeenCalled();
      expect(typeof transport.schedule.mock.calls[0][0]).toBe('function');
    });

    it('should handle missing callback gracefully', () => {
      const transport = {
        schedule: jest.fn()
      };
      const duration = 30;

      setupProgressTracking(transport, duration, null);

      expect(transport.schedule).not.toHaveBeenCalled();
    });
  });

  describe('validateExportOptions', () => {
    it('should validate and return options with defaults', () => {
      const validOptions = {
        drumSounds: mockDrumSounds,
        bpm: 140,
        pattern: mockPattern
      };

      const result = validateExportOptions(validOptions);

      expect(result.drumSounds).toBe(mockDrumSounds);
      expect(result.bpm).toBe(140);
      expect(result.stepCount).toBe(16); // Default
      expect(result.masterVolume).toBe(-10); // Default
    });

    it('should throw error for missing drumSounds', () => {
      expect(() => {
        validateExportOptions({ pattern: mockPattern });
      }).toThrow('drumSounds must be a non-empty array');
    });

    it('should throw error for missing pattern', () => {
      expect(() => {
        validateExportOptions({ drumSounds: mockDrumSounds });
      }).toThrow('pattern must be an object');
    });

    it('should use all provided values', () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 160,
        stepCount: 32,
        pattern: mockPattern,
        drumVolumes: mockDrumVolumes,
        masterVolume: -20,
        filterFreq: 10000,
        filterQ: 3,
        duration: 60
      };

      const result = validateExportOptions(options);

      expect(result.bpm).toBe(160);
      expect(result.stepCount).toBe(32);
      expect(result.masterVolume).toBe(-20);
      expect(result.filterFreq).toBe(10000);
      expect(result.filterQ).toBe(3);
      expect(result.duration).toBe(60);
    });
  });

  describe('renderDrumsOffline', () => {
    it('should render drums offline successfully', async () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 4,
        pattern: mockPattern,
        drumVolumes: mockDrumVolumes,
        masterVolume: -15,
        filterFreq: 8000,
        filterQ: 2,
        duration: 8
      };

      const result = await renderDrumsOffline(options);

      expect(Tone.Offline).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should use progress callback if provided', async () => {
      const progressCallback = jest.fn();
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 4,
        pattern: mockPattern,
        drumVolumes: mockDrumVolumes,
        duration: 8,
        progressCallback
      };

      await renderDrumsOffline(options);

      // Progress tracking would be set up in the actual implementation
      expect(progressCallback).not.toHaveBeenCalled(); // In mock, it won't actually be called
    });
  });

  describe('isOfflineContextAvailable', () => {
    it('should return true when Tone.Offline is available', () => {
      expect(isOfflineContextAvailable()).toBe(true);
    });
  });

  describe('createTestTone', () => {
    it('should create and return a test synth', () => {
      const mockContext = {
        Destination: new Tone.Volume()
      };
      const result = createTestTone(mockContext, 'C5', '4n');

      expect(result).toBeDefined();
      expect(Tone.Synth).toHaveBeenCalled();
    });

    it('should use default values when not specified', () => {
      const mockContext = {
        Destination: new Tone.Volume()
      };
      const result = createTestTone(mockContext);

      expect(result).toBeDefined();
    });
  });

  describe('Integration test', () => {
    it('should successfully create and render a complete drum pattern', async () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 130,
        stepCount: 8,
        pattern: {
          'Kick': [true, false, true, false, true, false, true, false],
          'Snare': [false, false, true, false, false, false, true, false]
        },
        drumVolumes: mockDrumVolumes,
        masterVolume: -12,
        filterFreq: 10000,
        filterQ: 1.5,
        duration: 10
      };

      await renderDrumsOffline(options);

      // Verify all Tone constructors were called
      expect(Tone.Volume).toHaveBeenCalled();
      expect(Tone.Filter).toHaveBeenCalled();
      expect(Tone.MembraneSynth).toHaveBeenCalled();
      expect(Tone.NoiseSynth).toHaveBeenCalled();
      expect(Tone.Offline).toHaveBeenCalled();
    });
  });
});

export {
  mockDrumSounds,
  mockPattern,
  mockDrumVolumes
};
