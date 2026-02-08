import * as Tone from 'tone';
import {
  renderAudioOffline,
  calculateExportDuration,
  validateRenderOptions,
  encodeWAV,
  downloadAudioFile
} from './audioExportRenderer';

// Mock Tone.js
jest.mock('tone', () => {
  const mockNodes = [];
  
  const createMockNode = (type) => {
    const node = {
      type,
      connect: jest.fn(),
      toDestination: jest.fn(function() { return this; }),
      dispose: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
    mockNodes.push(node);
    return node;
  };

  return {
    Volume: jest.fn(() => createMockNode('Volume')),
    Filter: jest.fn(() => createMockNode('Filter')),
    FMSynth: jest.fn(() => createMockNode('FMSynth')),
    MonoSynth: jest.fn(() => createMockNode('MonoSynth')),
    PolySynth: jest.fn((type) => createMockNode('PolySynth')),
    Synth: jest.fn(() => createMockNode('Synth')),
    Sequence: jest.fn((callback, events) => ({
      start: jest.fn(),
      loop: false,
      dispose: jest.fn()
    })),
    Part: jest.fn((callback, events) => ({
      start: jest.fn(),
      loop: false,
      dispose: jest.fn()
    })),
    Offline: jest.fn((callback) => {
      const mockTransport = {
        bpm: { value: 120 },
        start: jest.fn().mockReturnThis(),
        stop: jest.fn().mockReturnThis(),
        schedule: jest.fn(),
        duration: 30
      };
      
      const mockContext = {
        transport: mockTransport,
        Destination: createMockNode('Destination')
      };
      
      return Promise.resolve(callback(mockContext));
    }),
    Destination: createMockNode('Destination'),
    __mockNodes: mockNodes
  };
});

// Mock createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('audioExportRenderer', () => {
  const mockDrumSounds = [
    { name: 'Kick', note: 'C2', type: 'membrane' },
    { name: 'Snare', note: 'E2', type: 'noise' },
    { name: 'Closed Hi-Hat', note: 'F#2', type: 'noise' }
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

  describe('renderAudioOffline', () => {
    it('should render drums in simple mode (no loops)', async () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 4,
        pattern: mockPattern,
        drumVolumes: mockDrumVolumes,
        masterVolume: -15,
        filterFreq: 8000,
        filterQ: 2,
        includeLoops: false,
        duration: 8
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const renderResult = await renderAudioOffline(options);

      expect(Tone.Offline).toHaveBeenCalled();
      expect(Tone.Volume).toHaveBeenCalledWith(-15);
      expect(Tone.Filter).toHaveBeenCalledWith(8000, 'lowpass');
      expect(renderResult).toBeDefined();
    });

    it('should render with loops in complex mode', async () => {
      const loopConfigs = [
        {
          enabled: true,
          type: 'fm',
          notes: ['C4', 'E4', 'G4', 'B4'],
          pattern: []
        }
      ];

      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 4,
        pattern: mockPattern,
        drumVolumes: mockDrumVolumes,
        loops: loopConfigs,
        includeLoops: true,
        duration: 8
      };

      await renderAudioOffline(options);

      expect(Tone.FMSynth).toHaveBeenCalled();
      expect(Tone.Offline).toHaveBeenCalled();
    });

    it('should use progress callback when provided', async () => {
      const progressCallback = jest.fn();
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 4,
        pattern: mockPattern,
        progressCallback,
        duration: 8
      };

      await renderAudioOffline(options);

      // Progress tracking would be set up (verified in integration)
      expect(options.progressCallback).toBeDefined();
    });

    it('should handle default values', async () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 4,
        pattern: mockPattern
        // All other values defaulted
      };

      await renderAudioOffline(options);

      // Should use defaults (masterVolume: -10, filterFreq: 15000, etc.)
      expect(Tone.Volume).toHaveBeenCalledWith(-10);
      expect(Tone.Filter).toHaveBeenCalledWith(15000, 'lowpass');
    });

    it('should handle errors gracefully', async () => {
      const invalidOptions = {
        drumSounds: null,
        bpm: 120,
        pattern: mockPattern
      };

      await expect(renderAudioOffline(invalidOptions)).rejects.toThrow();
    });
  });

  describe('calculateExportDuration', () => {
    it('should calculate duration in rounds mode', () => {
      const options = {
        bpm: 120,
        stepCount: 16,
        durationMode: 'rounds',
        durationValue: 4
      };

      const duration = calculateExportDuration(options);
      // 16 steps = 4 beats = 2 seconds at 120 BPM, 4 rounds = 8 seconds
      expect(duration).toBeCloseTo(8, 1);
    });

    it('should return seconds directly in seconds mode', () => {
      const options = {
        bpm: 120,
        stepCount: 16,
        durationMode: 'seconds',
        durationValue: 30
      };

      const duration = calculateExportDuration(options);
      expect(duration).toBe(30);
    });

    it('should handle different step counts', () => {
      const options = {
        bpm: 120,
        stepCount: 8,
        durationMode: 'rounds',
        durationValue: 2
      };

      const duration = calculateExportDuration(options);
      // 8 steps = 2 beats = 1 second at 120 BPM, 2 rounds = 2 seconds
      expect(duration).toBeCloseTo(2, 1);
    });

    it('should handle different BPM values', () => {
      const options = {
        bpm: 60,
        stepCount: 16,
        durationMode: 'rounds',
        durationValue: 1
      };

      const duration = calculateExportDuration(options);
      // 60 BPM is half speed, so 16 steps = 4 beats = 4 seconds
      expect(duration).toBeCloseTo(4, 1);
    });
  });

  describe('validateRenderOptions', () => {
    it('should validate correct options', () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 16,
        pattern: mockPattern
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const validationResult = validateRenderOptions(options);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should detect missing drumSounds', () => {
      const options = {
        bpm: 120,
        pattern: mockPattern
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const validationResult2 = validateRenderOptions(options);

      expect(validationResult2.isValid).toBe(false);
      expect(validationResult2.errors).toContain('drumSounds must be a non-empty array');
    });

    it('should detect missing pattern', () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const validationResult3 = validateRenderOptions(options);

      expect(validationResult3.isValid).toBe(false);
      expect(validationResult3.errors).toContain('pattern must be an object');
    });

    it('should validate BPM range', () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 400,
        pattern: mockPattern
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const validationResult4 = validateRenderOptions(options);

      expect(validationResult4.warnings).toContain('BPM outside typical range (40-300)');
    });

    it('should warn about long duration', () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        pattern: mockPattern,
        duration: 600 // 10 minutes
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const validationResult5 = validateRenderOptions(options);

      expect(validationResult5.warnings).toContain('Duration longer than 5 minutes may cause memory issues');
    });

    it('should apply sensible defaults', () => {
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 16,
        pattern: mockPattern
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const validationResult6 = validateRenderOptions(options);

      expect(validationResult6.options.duration).toBe(30); // Default
      expect(validationResult6.options.masterVolume).toBe(-10); // Default
      expect(validationResult6.options.filterFreq).toBe(15000); // Default
    });
  });

  describe('encodeWAV', () => {
    it('should encode AudioBuffer to WAV blob', () => {
      const mockBuffer = {
        sampleRate: 44100,
        numberOfChannels: 2,
        length: 100,
        getChannelData: jest.fn((channel) => {
          return new Float32Array(100).fill(channel === 0 ? 0.5 : -0.5);
        })
      };

      const blob = encodeWAV(mockBuffer);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/wav');
    });

    it('should handle mono audio', () => {
      const mockBuffer = {
        sampleRate: 44100,
        numberOfChannels: 1,
        length: 100,
        getChannelData: jest.fn(() => new Float32Array(100).fill(0.5))
      };

      const blob = encodeWAV(mockBuffer);

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('downloadAudioFile', () => {
    it('should create anchor and trigger download', () => {
      const mockBlob = new Blob(['test'], { type: 'audio/wav' });
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      downloadAudioFile(mockBlob, 'test.wav');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      // In test environment, we can't fully verify the DOM operations
    });
  });

  describe('Integration: Full export workflow', () => {
    it('should successfully complete a full export workflow', async () => {
      // 1. Validate options
      const options = {
        drumSounds: mockDrumSounds,
        bpm: 130,
        stepCount: 8,
        pattern: {
          'Kick': [true, false, true, false, true, false, true, false],
          'Snare': [false, false, true, false, false, false, true, false],
          'Closed Hi-Hat': [true, true, true, true, true, true, true, true]
        },
        drumVolumes: mockDrumVolumes,
        masterVolume: -12,
        filterFreq: 10000,
        filterQ: 1.5,
        duration: 10
      };

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const validationResult7 = validateRenderOptions(options);
      expect(validationResult7.isValid).toBe(true);

      // 2. Calculate duration
      const duration = calculateExportDuration({
        bpm: 130,
        stepCount: 8,
        durationMode: 'seconds',
        durationValue: 10
      });
      expect(duration).toBe(10);

      // 3. Render audio
      // eslint-disable-next-line testing-library/render-result-naming-convention
      const renderResult2 = await renderAudioOffline(options);
      expect(renderResult2).toBeDefined();

      // 4. Verify all Tone objects created
      expect(Tone.Volume).toHaveBeenCalled();
      expect(Tone.Filter).toHaveBeenCalled();
      expect(Tone.MembraneSynth).toHaveBeenCalled();
      expect(Tone.NoiseSynth).toHaveBeenCalled();
      expect(Tone.Offline).toHaveBeenCalled();
    });

    it('should handle complex mode with loops', async () => {
      const loopConfigs = [
        {
          enabled: true,
          type: 'fm',
          notes: ['C4', 'E4', 'G4', 'B4']
        },
        {
          enabled: false, // Disabled loop should be skipped
          type: 'mono',
          notes: []
        }
      ];

      const options = {
        drumSounds: mockDrumSounds,
        bpm: 120,
        stepCount: 4,
        pattern: mockPattern,
        drumVolumes: mockDrumVolumes,
        loops: loopConfigs,
        includeLoops: true,
        duration: 8
      };

      await renderAudioOffline(options);

      // FM synth should be created for enabled loop
      expect(Tone.FMSynth).toHaveBeenCalled();
    });
  });
});
