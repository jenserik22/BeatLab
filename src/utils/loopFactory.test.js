import { 
  createLoopSynth, 
  createEffectsChain, 
  createLoopPattern, 
  createLoop,
  createLoops,
  createBuiltinLoops,
  createLoopPlayer,
  createUserLoop
} from './loopFactory';
import * as Tone from 'tone';

// Mock Tone.js - fixed versions that return proper instances
const createMockNode = () => ({
  connect: jest.fn(),
  dispose: jest.fn(),
  volume: { value: 0 }
});

const createMockStartNode = () => ({
  connect: jest.fn(),
  start: jest.fn(),
  dispose: jest.fn(),
  volume: { value: 0 }
});

jest.mock('tone', () => {
  // Create fresh instances for each test
  const Tone = {};
  
  // Synths
  Tone.FMSynth = jest.fn(() => ({
    ...createMockNode(),
    triggerAttackRelease: jest.fn()
  }));
  
  Tone.MonoSynth = jest.fn(() => ({
    ...createMockNode(),
    triggerAttackRelease: jest.fn()
  }));
  
  Tone.NoiseSynth = jest.fn(() => ({
    ...createMockNode(),
    triggerAttackRelease: jest.fn()
  }));
  
  Tone.PluckSynth = jest.fn(() => ({
    ...createMockNode(),
    triggerAttackRelease: jest.fn()
  }));
  
  Tone.PolySynth = jest.fn((synthType, options) => ({
    ...createMockNode(),
    triggerAttackRelease: jest.fn()
  }));
  
  Tone.Synth = jest.fn(() => ({
    ...createMockNode(),
    triggerAttackRelease: jest.fn()
  }));
  
  // Player for user-uploaded loops
  Tone.Player = jest.fn(() => ({
    ...createMockStartNode(),
    start: jest.fn(),
    stop: jest.fn(),
    connect: jest.fn(),
    dispose: jest.fn(),
    loop: false,
    autostart: false,
    volume: { value: 0 }
  }));
  
  // Effects
  Tone.Chorus = jest.fn(() => ({
    ...createMockStartNode(),
    start: jest.fn()
  }));
  
  Tone.FeedbackDelay = jest.fn(() => ({
    ...createMockNode()
  }));
  
  Tone.Filter = jest.fn(() => ({
    ...createMockNode()
  }));
  
  Tone.Distortion = jest.fn(() => ({
    ...createMockNode()
  }));
  
  Tone.Reverb = jest.fn(() => ({
    ...createMockNode()
  }));
  
  Tone.BitCrusher = jest.fn(() => ({
    ...createMockNode()
  }));
  
  // Player for user-uploaded loops
  Tone.Player = jest.fn(() => ({
    ...createMockStartNode(),
    start: jest.fn(),
    stop: jest.fn(),
    connect: jest.fn(),
    dispose: jest.fn(),
    loop: false,
    autostart: false,
    volume: { value: 0 }
  }));
  
  // Pattern
  Tone.Part = jest.fn((callback) => ({
    callback,
    loop: false,
    loopEnd: "1m",
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn()
  }));
  
  return Tone;
});

describe('loopFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLoopSynth', () => {
    it('should create FMSynth', () => {
      const synth = createLoopSynth({
        type: 'FMSynth',
        options: { harmonicity: 3 }
      });
      
      expect(Tone.FMSynth).toHaveBeenCalledWith({ harmonicity: 3 });
      expect(synth).toBeDefined();
    });

    it('should create MonoSynth', () => {
      const synth = createLoopSynth({
        type: 'MonoSynth',
        options: { oscillator: { type: 'sawtooth' } }
      });
      
      expect(Tone.MonoSynth).toHaveBeenCalled();
      expect(synth).toBeDefined();
    });

    it('should create NoiseSynth', () => {
      const synth = createLoopSynth({
        type: 'NoiseSynth',
        options: { noise: { type: 'white' } }
      });
      
      expect(Tone.NoiseSynth).toHaveBeenCalled();
      expect(synth).toBeDefined();
    });

    it('should create PluckSynth', () => {
      const synth = createLoopSynth({
        type: 'PluckSynth',
        options: {}
      });
      
      expect(Tone.PluckSynth).toHaveBeenCalled();
      expect(synth).toBeDefined();
    });

    it('should create PolySynth with synth type', () => {
      const synth = createLoopSynth({
        type: 'PolySynth',
        synthType: 'FMSynth',
        options: { harmonicity: 2 }
      });
      
      expect(Tone.PolySynth).toHaveBeenCalledWith(Tone.FMSynth, { harmonicity: 2 });
      expect(synth).toBeDefined();
    });

    it('should handle unknown synth type gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const synth = createLoopSynth({
        type: 'UnknownSynth',
        options: {}
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown synth type: UnknownSynth, defaulting to Synth');
      expect(Tone.Synth).toHaveBeenCalled();
      expect(synth).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('createEffectsChain', () => {
    const mockTargetNode = { connect: jest.fn() };
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle empty effects array', () => {
      const result = createEffectsChain([], mockTargetNode);
      expect(result).toBe(mockTargetNode);
    });

    it('should create single effect chain', () => {
      const effects = [
        { type: 'Filter', options: [1000, 'lowpass'], connectTo: 'master' }
      ];
      
      const firstNode = createEffectsChain(effects, mockTargetNode);
      
      expect(Tone.Filter).toHaveBeenCalledWith(1000, 'lowpass');
      expect(firstNode).toBeDefined();
    });

    it('should create multiple effect chain', () => {
      const effects = [
        { type: 'Distortion', options: [0.5], connectTo: 'next' },
        { type: 'Filter', options: [800, 'lowpass'], connectTo: 'master' }
      ];
      
      const firstNode = createEffectsChain(effects, mockTargetNode);
      
      expect(Tone.Distortion).toHaveBeenCalledWith(0.5);
      expect(Tone.Filter).toHaveBeenCalledWith(800, 'lowpass');
      expect(firstNode).toBeDefined();
    });

    it('should connect effects in correct order', () => {
      const effects = [
        { type: 'FeedbackDelay', options: ['8n', 0.5], connectTo: 'next' },
        { type: 'Chorus', options: [4, 2, 0.3], connectTo: 'master' }
      ];
      
      const delayInstance = { connect: jest.fn(), dispose: jest.fn() };
      const chorusInstance = { connect: jest.fn(), start: jest.fn(), dispose: jest.fn() };
      
      Tone.FeedbackDelay.mockReturnValue(delayInstance);
      Tone.Chorus.mockReturnValue(chorusInstance);
      
      createEffectsChain(effects, mockTargetNode);
      
      expect(delayInstance.connect).toHaveBeenCalledWith(chorusInstance);
      expect(chorusInstance.connect).toHaveBeenCalledWith(mockTargetNode);
    });
  });

  describe('createLoopPattern', () => {
    let mockSynth;
    
    beforeEach(() => {
      mockSynth = {
        triggerAttackRelease: jest.fn()
      };
    });

    it('should create note pattern', () => {
      const patternConfig = {
        type: 'note',
        data: [
          { time: "0:0", note: "C4", duration: "8n" },
          { time: "0:1", note: "E4", duration: "16n" }
        ],
        loopEnd: "2m"
      };
      
      const part = createLoopPattern(patternConfig, mockSynth);
      
      expect(Tone.Part).toHaveBeenCalled();
      expect(part.loop).toBe(true);
      expect(part.loopEnd).toBe("2m");
    });

    it('should create chord pattern', () => {
      const patternConfig = {
        type: 'chord',
        data: [
          { time: "0:0", notes: ["C4", "E4", "G4"] }
        ],
        loopEnd: "2m"
      };
      
      const part = createLoopPattern(patternConfig, mockSynth);
      
      expect(Tone.Part).toHaveBeenCalled();
      expect(part.loop).toBe(true);
    });

    it('should create noise pattern', () => {
      const patternConfig = {
        type: 'noise',
        data: [
          { time: "0:0:3" },
          { time: "0:1:2" }
        ],
        loopEnd: "2m"
      };
      
      const part = createLoopPattern(patternConfig, mockSynth);
      
      expect(Tone.Part).toHaveBeenCalled();
      expect(part.loop).toBe(true);
    });

    it('should handle unknown pattern type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const patternConfig = {
        type: 'unknown',
        data: [],
        loopEnd: "2m"
      };
      
      const part = createLoopPattern(patternConfig, mockSynth);
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown pattern type: unknown, creating empty part');
      expect(part.loop).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('createLoop', () => {
    const mockTargetNode = { connect: jest.fn() };
    const mockRegisterEffect = jest.fn();
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create complete loop with synth, effects, and pattern', () => {
      const loopConfig = {
        id: 'test-loop',
        synthConfig: {
          type: 'FMSynth',
          options: { harmonicity: 3 }
        },
        effects: [
          {
            type: 'Chorus',
            options: [4, 2, 0.5],
            connectTo: 'master'
          }
        ],
        pattern: {
          type: 'note',
          data: [
            { time: "0:0", note: "C4", duration: "8n" }
          ],
          loopEnd: "1m"
        }
      };
      
      const { synthRef, loopRef } = createLoop(loopConfig, mockTargetNode, mockRegisterEffect);
      
      expect(synthRef.current).toBeDefined();
      expect(loopRef.current).toBeDefined();
      expect(Tone.FMSynth).toHaveBeenCalled();
      expect(Tone.Part).toHaveBeenCalled();
    });

    it('should create loop without effects', () => {
      const loopConfig = {
        id: 'test-loop',
        synthConfig: {
          type: 'Synth',
          options: {}
        },
        effects: [],
        pattern: {
          type: 'note',
          data: [],
          loopEnd: "1m"
        }
      };
      
      const { synthRef, loopRef } = createLoop(loopConfig, mockTargetNode);
      
      expect(synthRef.current).toBeDefined();
      expect(loopRef.current).toBeDefined();
    });

    it('should handle loop creation errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const badConfig = {
        id: 'bad-loop',
        // Missing required fields
      };
      
      const { synthRef, loopRef } = createLoop(badConfig, mockTargetNode);
      
      expect(synthRef.current).toBe(null);
      expect(loopRef.current).toBe(null);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should throw error for missing config', () => {
      expect(() => createLoop(null, mockTargetNode)).toThrow('Loop configuration is required');
    });
  });

  describe('createLoops', () => {
    const mockTargetNode = { connect: jest.fn() };
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create multiple loops', () => {
      const loopConfigs = [
        {
          id: 'loop1',
          synthConfig: { type: 'FMSynth', options: {} },
          effects: [],
          pattern: { type: 'note', data: [], loopEnd: "1m" }
        },
        {
          id: 'loop2', 
          synthConfig: { type: 'Synth', options: {} },
          effects: [],
          pattern: { type: 'note', data: [], loopEnd: "1m" }
        }
      ];
      
      const { synthRefs, loopRefs } = createLoops(loopConfigs, mockTargetNode);
      
      expect(synthRefs.length).toBe(2);
      expect(loopRefs.length).toBe(2);
      expect(synthRefs[0].current).toBeDefined();
      expect(synthRefs[1].current).toBeDefined();
    });
  });

  describe('createBuiltinLoops', () => {
    const mockTargetNode = { connect: jest.fn() };
    const mockRegisterEffect = jest.fn();
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create all 6 builtin loops', () => {
      const { synthRefs, loopRefs } = createBuiltinLoops(mockTargetNode, mockRegisterEffect);
      
      expect(synthRefs.length).toBe(6);
      expect(loopRefs.length).toBe(6);
      
      // Verify all refs are created
      synthRefs.forEach(ref => expect(ref.current).toBeDefined());
      loopRefs.forEach(ref => expect(ref.current).toBeDefined());
    });

    it('should have different synth types for each loop', () => {
      createBuiltinLoops(mockTargetNode, mockRegisterEffect);
      
      // Should have created different synth types
      expect(Tone.FMSynth).toHaveBeenCalled(); // loop1
      expect(Tone.PolySynth).toHaveBeenCalled(); // loop2
      expect(Tone.MonoSynth).toHaveBeenCalled(); // loop3
      expect(Tone.PolySynth).toHaveBeenCalled(); // loop4
      expect(Tone.PluckSynth).toHaveBeenCalled(); // loop5
      expect(Tone.NoiseSynth).toHaveBeenCalled(); // loop6
    });
  });

  describe('createLoopPlayer', () => {
    it('should create Tone.Player with correct config', () => {
      const testUrl = 'blob://test.wav';
      
      const player = createLoopPlayer(testUrl);
      
      expect(Tone.Player).toHaveBeenCalledWith({
        url: testUrl,
        autostart: false,
        loop: true
      });
      expect(player).toBeDefined();
    });

    it('should throw error if no URL provided', () => {
      expect(() => createLoopPlayer(null)).toThrow('User loop URL is required for player creation');
      expect(() => createLoopPlayer('')).toThrow('User loop URL is required for player creation');
    });
  });

  describe('createUserLoop', () => {
    const mockTargetNode = { connect: jest.fn() };
    
    it('should create user loop with player and control interface', () => {
      const testUrl = 'blob://user-loop.wav';
      
      const result = createUserLoop(testUrl, mockTargetNode);
      
      expect(result.playerRef).toBeDefined();
      expect(result.playerRef.current).toBeDefined();
      expect(result.controlRef).toBeDefined();
      expect(result.controlRef.current).toBeDefined();
      
      // Verify player was connected to target
      expect(result.playerRef.current.connect).toHaveBeenCalledWith(mockTargetNode);
    });

    it('should return control interface with start/stop/dispose methods', () => {
      const testUrl = 'blob://test.wav';
      
      const { controlRef } = createUserLoop(testUrl, mockTargetNode);
      
      expect(controlRef.current.start).toBeDefined();
      expect(controlRef.current.stop).toBeDefined();
      expect(controlRef.current.dispose).toBeDefined();
      expect(typeof controlRef.current.start).toBe('function');
      expect(typeof controlRef.current.stop).toBe('function');
    });

    it('should initialize player with mute property', () => {
      const testUrl = 'blob://test.wav';
      
      const { controlRef } = createUserLoop(testUrl, mockTargetNode);
      
      expect(controlRef.current.mute).toBe(false);
    });
  });
});
