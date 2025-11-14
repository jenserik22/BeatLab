import * as Tone from 'tone';
import { createKitSynths, disposeKitSynths, getVelocityForStep } from './kitFactory';
import { getDefaultKit } from '../constants/kitsConfig';

// Mock Tone.js
jest.mock('tone', () => ({
  Volume: jest.fn().mockImplementation(function(volume) {
    this.volume = { value: volume };
    this.connect = jest.fn(function() { return this; });
    this.dispose = jest.fn();
    this.toDestination = jest.fn(function() { return this; });
  }),
  MembraneSynth: jest.fn().mockImplementation(function(options) {
    this.options = options;
    this.connect = jest.fn(function() { return this; });
    this.dispose = jest.fn();
    this.triggerAttackRelease = jest.fn();
  }),
  NoiseSynth: jest.fn().mockImplementation(function(options) {
    this.options = options;
    this.connect = jest.fn(function() { return this; });
    this.dispose = jest.fn();
    this.triggerAttackRelease = jest.fn();
  }),
  Filter: jest.fn().mockImplementation(function(config) {
    this.frequency = { value: config.frequency || 0 };
    this.type = config.type || 'lowpass';
    this.connect = jest.fn(function() { return this; });
    this.dispose = jest.fn();
  }),
  BitCrusher: jest.fn().mockImplementation(function(config) {
    this.bits = config.bits || 8;
    this.connect = jest.fn(function() { return this; });
    this.dispose = jest.fn();
  }),
  Distortion: jest.fn().mockImplementation(function(config) {
    this.distortion = config.distortion || 0;
    this.connect = jest.fn(function() { return this; });
    this.dispose = jest.fn();
  }),
  Destination: {}
}));

describe('kitFactory', () => {
  let mockDestination;
  let mockRegisterEffect;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    mockDestination = {
      connect: jest.fn()
    };
    mockRegisterEffect = jest.fn();
  });

  describe('createKitSynths', () => {
    it('should create all 8 drum synths for the default kit', () => {
      const defaultKit = getDefaultKit();
      const result = createKitSynths(defaultKit, mockDestination, mockRegisterEffect);

      expect(result.synths).toBeDefined();
      expect(result.drumVolumes).toBeDefined();
      expect(result.velocityShapes).toBeDefined();
      expect(result.effectNodes).toBeDefined();

      // Should have all 8 drum sounds
      expect(Object.keys(result.synths).length).toBe(8);
      expect(result.synths['Kick']).toBeDefined();
      expect(result.synths['Snare']).toBeDefined();
      expect(result.synths['Closed Hi-Hat']).toBeDefined();
      expect(result.synths['Open Hi-Hat']).toBeDefined();
      expect(result.synths['Clap']).toBeDefined();
      expect(result.synths['Crash']).toBeDefined();
      expect(result.synths['Tom Low']).toBeDefined();
      expect(result.synths['Tom High']).toBeDefined();
    });

    it('should create volume nodes for each drum', () => {
      const defaultKit = getDefaultKit();
      const result = createKitSynths(defaultKit, mockDestination, mockRegisterEffect);

      expect(Object.keys(result.drumVolumes).length).toBe(8);
      expect(result.drumVolumes['Kick']).toBeDefined();
      expect(result.drumVolumes['Kick'].volume.value).toBe(-6); // Lo-Fi Chill kit has masterVolume: -6
    });

    it('should return velocity shapes from the kit config', () => {
      const defaultKit = getDefaultKit();
      const result = createKitSynths(defaultKit, mockDestination, mockRegisterEffect);

      expect(result.velocityShapes).toEqual(defaultKit.velocityShapes);
      expect(result.velocityShapes['Kick']).toBeDefined();
      expect(Array.isArray(result.velocityShapes['Kick'])).toBe(true);
    });

    it('should connect synths to effects and then to destination', () => {
      const defaultKit = getDefaultKit();
      createKitSynths(defaultKit, mockDestination, mockRegisterEffect);

      // Verify Tone.Volume was called for each drum
      expect(Tone.Volume).toHaveBeenCalled();
      
      // Verify filters were created for drums with effects (Lo-Fi kit has filters)
      expect(Tone.Filter).toHaveBeenCalled();
    });

    it('should register effect nodes for cleanup', () => {
      const defaultKit = getDefaultKit();
      createKitSynths(defaultKit, mockDestination, mockRegisterEffect);

      // Should have called registerEffectNode for each effect in the kit
      expect(mockRegisterEffect).toHaveBeenCalled();
    });

    it('should throw error for invalid kit configuration', () => {
      expect(() => {
        createKitSynths(null, mockDestination, mockRegisterEffect);
      }).toThrow('Invalid kit configuration: missing drums definition');

      expect(() => {
        createKitSynths({}, mockDestination, mockRegisterEffect);
      }).toThrow('Invalid kit configuration: missing drums definition');
    });

    it('should handle drums with no effects gracefully', () => {
      const minimalKit = {
        ...getDefaultKit(),
        drums: {
          'Kick': {
            type: 'MembraneSynth',
            options: {},
            effects: [] // No effects
          }
        }
      };

      const result = createKitSynths(minimalKit, mockDestination, mockRegisterEffect);
      expect(result.synths['Kick']).toBeDefined();
    });
  });

  describe('disposeKitSynths', () => {
    it('should dispose all synths, volumes, and effects', () => {
      const defaultKit = getDefaultKit();
      const result = createKitSynths(defaultKit, mockDestination, mockRegisterEffect);
      
      disposeKitSynths(result);

      // Verify dispose was called on all synths
      Object.values(result.synths).forEach(synth => {
        expect(synth.dispose).toHaveBeenCalled();
      });

      // Verify dispose was called on all volume nodes
      Object.values(result.drumVolumes).forEach(vol => {
        expect(vol.dispose).toHaveBeenCalled();
      });

      // Verify dispose was called on all effect nodes
      result.effectNodes.forEach(node => {
        expect(node.dispose).toHaveBeenCalled();
      });
    });

    it('should handle null input gracefully', () => {
      expect(() => {
        disposeKitSynths(null);
      }).not.toThrow();
    });

    it('should handle partial data gracefully', () => {
      const partialData = {
        synths: null,
        drumVolumes: undefined,
        effectNodes: []
      };

      expect(() => {
        disposeKitSynths(partialData);
      }).not.toThrow();
    });

    it('should continue disposing even if one node throws error', () => {
      const defaultKit = getDefaultKit();
      const result = createKitSynths(defaultKit, mockDestination, mockRegisterEffect);

      // Make one synth throw an error on dispose
      const firstSynth = Object.values(result.synths)[0];
      firstSynth.dispose.mockImplementation(() => {
        throw new Error('Dispose error');
      });

      // Should not throw
      expect(() => {
        disposeKitSynths(result);
      }).not.toThrow();

      // Other synths should still be disposed
      const otherSynths = Object.values(result.synths).slice(1);
      otherSynths.forEach(synth => {
        expect(synth.dispose).toHaveBeenCalled();
      });
    });
  });

  describe('getVelocityForStep', () => {
    it('should return velocity for a given drum and step', () => {
      const velocityShapes = {
        'Kick': [1.0, 0.8, 1.0, 0.7],
        'Snare': [0.9, 0.6]
      };

      expect(getVelocityForStep(velocityShapes, 'Kick', 0)).toBe(1.0);
      expect(getVelocityForStep(velocityShapes, 'Kick', 1)).toBe(0.8);
      expect(getVelocityForStep(velocityShapes, 'Kick', 2)).toBe(1.0);
      expect(getVelocityForStep(velocityShapes, 'Kick', 3)).toBe(0.7);
      expect(getVelocityForStep(velocityShapes, 'Kick', 4)).toBe(1.0); // Cycles back

      expect(getVelocityForStep(velocityShapes, 'Snare', 0)).toBe(0.9);
      expect(getVelocityForStep(velocityShapes, 'Snare', 1)).toBe(0.6);
      expect(getVelocityForStep(velocityShapes, 'Snare', 2)).toBe(0.9); // Cycles back
    });

    it('should return default velocity of 1.0 for missing drum', () => {
      const velocityShapes = {
        'Kick': [1.0, 0.8]
      };

      expect(getVelocityForStep(velocityShapes, 'MissingDrum', 0)).toBe(1.0);
    });

    it('should return default velocity of 1.0 for null/undefined shapes', () => {
      expect(getVelocityForStep(null, 'Kick', 0)).toBe(1.0);
      expect(getVelocityForStep(undefined, 'Kick', 0)).toBe(1.0);
    });

    it('should return default velocity of 1.0 for empty array', () => {
      const velocityShapes = {
        'Kick': []
      };

      expect(getVelocityForStep(velocityShapes, 'Kick', 0)).toBe(1.0);
    });

    it('should return default velocity of 1.0 for non-array shape', () => {
      const velocityShapes = {
        'Kick': 'invalid'
      };

      expect(getVelocityForStep(velocityShapes, 'Kick', 0)).toBe(1.0);
    });
  });
});
