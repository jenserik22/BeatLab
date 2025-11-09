import * as Tone from 'tone';

/**
 * Creates a Tone.js synth based on configuration
 * @param {Object} synthConfig - Synth configuration from LOOP_CONFIGS
 * @returns {Object} Created synth instance
 */
export const createLoopSynth = (synthConfig) => {
  const { type, synthType, options = {} } = synthConfig;
  
  switch (type) {
    case 'FMSynth':
      return new Tone.FMSynth(options);
    
    case 'MonoSynth':
      return new Tone.MonoSynth(options);
    
    case 'NoiseSynth':
      return new Tone.NoiseSynth(options);
    
    case 'PluckSynth':
      return new Tone.PluckSynth(options);
    
    case 'PolySynth':
      if (synthType) {
        return new Tone.PolySynth(Tone[synthType], options);
      }
      return new Tone.PolySynth(options);
    
    default:
      console.warn(`Unknown synth type: ${type}, defaulting to Synth`);
      return new Tone.Synth(options);
  }
};

/**
 * Creates and connects effects chain
 * @param {Array} effects - Array of effect configurations
 * @param {Object} targetNode - Final target node to connect to
 * @returns {Object} First effect node in chain
 */
export const createEffectsChain = (effects, targetNode) => {
  if (!effects || effects.length === 0) {
    return targetNode;
  }
  
  let firstNode = null;
  let previousNode = null;
  
  effects.forEach((effectConfig, index) => {
    const { type, options = [], connectTo } = effectConfig;
    
    let effectNode;
    switch (type) {
      case 'Chorus':
        effectNode = new Tone.Chorus(...options);
        effectNode.start();
        break;
      case 'FeedbackDelay':
        effectNode = new Tone.FeedbackDelay(...options);
        break;
      case 'Filter':
        effectNode = new Tone.Filter(...options);
        break;
      case 'Distortion':
        effectNode = new Tone.Distortion(...options);
        break;
      case 'Reverb':
        effectNode = new Tone.Reverb(...options);
        break;
      case 'BitCrusher':
        effectNode = new Tone.BitCrusher(...options);
        break;
      default:
        console.warn(`Unknown effect type: ${type}, skipping`);
        return;
    }
    
    // Store first node for return
    if (index === 0) {
      firstNode = effectNode;
    }
    
    // Connect in chain
    if (previousNode) {
      previousNode.connect(effectNode);
    }
    
    // Connect to target if this is the last node or connectTo is 'master'
    if (connectTo === 'master' || index === effects.length - 1) {
      effectNode.connect(targetNode);
    }
    
    previousNode = effectNode;
  });
  
  return firstNode || targetNode;
};

/**
 * Creates a Tone.Part for a loop based on pattern configuration
 * @param {Object} patternConfig - Pattern configuration
 * @param {Object} synth - Synth instance to trigger
 * @returns {Object} Created Tone.Part
 */
export const createLoopPattern = (patternConfig, synth) => {
  const { type, data, loopEnd } = patternConfig;
  
  let part;
  
  switch (type) {
    case 'note':
      part = new Tone.Part((time, value) => {
        synth.triggerAttackRelease(value.note, value.duration, time);
      }, data);
      break;
    
    case 'chord':
      part = new Tone.Part((time, value) => {
        synth.triggerAttackRelease(value.notes, "2n", time);
      }, data);
      break;
    
    case 'noise':
      part = new Tone.Part((time) => {
        synth.triggerAttackRelease("16n", time);
      }, data);
      break;
    
    default:
      console.warn(`Unknown pattern type: ${type}, creating empty part`);
      part = new Tone.Part(() => {}, []);
  }
  
  part.loop = true;
  part.loopEnd = loopEnd || "2m";
  
  return part;
};

/**
 * Creates a complete loop (synth, effects, pattern)
 * @param {Object} loopConfig - Loop configuration from LOOP_CONFIGS
 * @param {Object} targetNode - Target node to connect output to
 * @param {Function} registerEffect - Callback to register effect nodes for cleanup
 * @returns {Object} Object containing synthRef and loopRef
 */
export const createLoop = (loopConfig, targetNode, registerEffect = () => {}) => {
  if (!loopConfig) {
    throw new Error('Loop configuration is required');
  }
  
  const { id, synthConfig, effects, pattern } = loopConfig;
  
  try {
    // Create synth
    const synth = createLoopSynth(synthConfig);
    
    // Create effects chain
    let finalNode;
    if (effects && effects.length > 0) {
      finalNode = createEffectsChain(effects, targetNode);
      effects.forEach(effectConfig => {
        if (effectConfig.connectTo === 'next' || effectConfig.connectTo === 'master') {
          registerEffect(finalNode);
        }
      });
    } else {
      finalNode = targetNode;
    }
    
    // Connect synth to effects chain
    if (synth && finalNode) {
      synth.connect(finalNode);
    }
    
    // Create pattern
    const loopPart = createLoopPattern(pattern, synth);
    
    return {
      synthRef: { current: synth },
      loopRef: { current: loopPart }
    };
    
  } catch (error) {
    console.error(`Error creating loop '${id}':`, error);
    return {
      synthRef: { current: null },
      loopRef: { current: null }
    };
  }
};

/**
 * Creates multiple loops from configuration array
 * @param {Array} loopConfigs - Array of loop configurations
 * @param {Object} targetNode - Target node to connect output to
 * @param {Function} registerEffect - Callback to register effect nodes
 * @returns {Object} Object with arrays of synthRefs and loopRefs
 */
export const createLoops = (loopConfigs, targetNode, registerEffect = () => {}) => {
  const synthRefs = [];
  const loopRefs = [];
  
  loopConfigs.forEach((config, index) => {
    const { synthRef, loopRef } = createLoop(config, targetNode, registerEffect);
    synthRefs[index] = synthRef;
    loopRefs[index] = loopRef;
  });
  
  return {
    synthRefs,
    loopRefs
  };
};

/**
 * Creates the built-in loops (loop1 through loop6)
 * @param {Object} targetNode - Target node to connect output to
 * @param {Function} registerEffect - Callback to register effect nodes
 * @returns {Object} Object with synthRefs and loopRefs for loops 1-6
 */
export const createBuiltinLoops = (targetNode, registerEffect = () => {}) => {
  const LOOP_CONFIGS = [
    {
      id: 'loop1',
      label: 'Synth Arp',
      type: 'melodic',
      
      synthConfig: {
        type: 'FMSynth',
        options: {
          harmonicity: 3,
          modulationIndex: 10,
          detune: 0,
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.01,
            decay: 0.01,
            sustain: 1,
            release: 0.5
          },
          modulation: {
            type: "square"
          },
          modulationEnvelope: {
            attack: 0.5,
            decay: 0,
            sustain: 1,
            release: 0.5
          }
        }
      },
      
      effects: [
        {
          type: 'FeedbackDelay',
          options: ["8n", 0.5],
          connectTo: 'next'
        },
        {
          type: 'Chorus',
          options: [4, 2.5, 0.5],
          connectTo: 'master'
        }
      ],
      
      pattern: {
        type: 'note',
        data: [
          { time: "0:0", note: "C4", duration: "8n" },
          { time: "0:1", note: "E4", duration: "16n" },
          { time: "0:2", note: "G4", duration: "8n" },
          { time: "0:3", note: "B4", duration: "16n" },
          { time: "1:0", note: "C5", duration: "8n" },
          { time: "1:1", note: "B4", duration: "16n" },
          { time: "1:2", note: "G4", duration: "8n" },
          { time: "1:3", note: "E4", duration: "16n" },
        ],
        loopEnd: "2m"
      }
    },
    
    {
      id: 'loop2',
      label: 'Piano',
      type: 'harmonic',
      
      synthConfig: {
        type: 'PolySynth',
        synthType: 'Synth',
        options: {
          oscillator: {
            type: "triangle"
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          }
        }
      },
      
      effects: [],
      
      pattern: {
        type: 'chord',
        data: [
          { time: "0:0", notes: ["C4", "E4", "G4"] },
          { time: "0:2", notes: ["G3", "B3", "D4"] },
          { time: "1:0", notes: ["A3", "C4", "E4"] },
          { time: "1:2", notes: ["F3", "A3", "C4"] }
        ],
        loopEnd: "2m"
      }
    },
    
    {
      id: 'loop3',
      label: 'Techno',
      type: 'bass',
      
      synthConfig: {
        type: 'MonoSynth',
        options: {
          oscillator: {
            type: "sawtooth"
          },
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.2,
            release: 0.1
          }
        }
      },
      
      effects: [
        {
          type: 'Distortion',
          options: [0.4],
          connectTo: 'next'
        },
        {
          type: 'Filter',
          options: [1200, "lowpass"],
          connectTo: 'master'
        }
      ],
      
      pattern: {
        type: 'note',
        data: [
          { time: "0:0", note: "C3", duration: "8n" },
          { time: "0:1.5", note: "C3", duration: "16n" },
          { time: "0:2", note: "G2", duration: "8n" },
          { time: "0:3", note: "G2", duration: "16n" },
          { time: "1:0", note: "C3", duration: "8n" },
          { time: "1:1.5", note: "C3", duration: "16n" },
          { time: "1:2", note: "A2", duration: "8n" },
          { time: "1:3", note: "A2", duration: "16n" },
        ],
        loopEnd: "2m"
      }
    },
    
    {
      id: 'loop4',
      label: 'Ambient Pad',
      type: 'harmonic',
      
      synthConfig: {
        type: 'PolySynth',
        synthType: 'FMSynth',
        options: {
          harmonicity: 1,
          modulationIndex: 10,
          detune: 0,
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.8,
            decay: 0.4,
            sustain: 0.8,
            release: 2
          },
          modulation: {
            type: "sine"
          },
          modulationEnvelope: {
            attack: 0.8,
            decay: 0,
            sustain: 1,
            release: 2
          }
        }
      },
      
      effects: [
        {
          type: 'Filter',
          options: [200, "lowpass"],
          connectTo: 'master'
        }
      ],
      
      pattern: {
        type: 'chord',
        data: [
          { time: "0:0", notes: ["C2", "G2", "C3", "E3"] },
          { time: "2:0", notes: ["F2", "C3", "F3", "A3"] },
          { time: "4:0", notes: ["G2", "D3", "G3", "B3"] },
          { time: "6:0", notes: ["E2", "B2", "E3", "G#3"] }
        ],
        loopEnd: "4m"
      }
    },
    
    {
      id: 'loop5',
      label: 'Pluck Synth',
      type: 'melodic',
      
      synthConfig: {
        type: 'PluckSynth',
        options: {}
      },
      
      effects: [
        {
          type: 'Reverb',
          options: [5],
          connectTo: 'master'
        }
      ],
      
      pattern: {
        type: 'note',
        data: [
          { time: "0:0", note: "C5", duration: "8n" },
          { time: "0:1", note: "E5", duration: "8n" },
          { time: "0:2", note: "G5", duration: "8n" },
          { time: "0:3", note: "B5", duration: "8n" },
          { time: "1:0", note: "C6", duration: "8n" },
          { time: "1:1", note: "B5", duration: "8n" },
          { time: "1:2", note: "G5", duration: "8n" },
          { time: "1:3", note: "E5", duration: "8n" },
          { time: "2:0", note: "D5", duration: "8n" },
          { time: "2:1", note: "F5", duration: "8n" },
          { time: "2:2", note: "A5", duration: "8n" },
          { time: "2:3", note: "C6", duration: "8n" },
          { time: "3:0", note: "B5", duration: "8n" },
          { time: "3:1", note: "A5", duration: "8n" },
          { time: "3:2", note: "F5", duration: "8n" },
          { time: "3:3", note: "D5", duration: "8n" }
        ],
        loopEnd: "2m"
      }
    },
    
    {
      id: 'loop6',
      label: 'Glitchy Perc',
      type: 'percussive',
      
      synthConfig: {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: "white"
          },
          envelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0
          }
        }
      },
      
      effects: [
        {
          type: 'BitCrusher',
          options: [4],
          connectTo: 'master'
        }
      ],
      
      pattern: {
        type: 'noise',
        data: [
          { time: "0:0:3" },
          { time: "0:1:2" },
          { time: "0:2:1" },
          { time: "0:3:0" },
          { time: "1:0:3" },
          { time: "1:1:2" },
          { time: "1:2:1" },
          { time: "1:3:0" },
          { time: "2:0:2" },
          { time: "2:1:1" },
          { time: "2:2:3" },
          { time: "2:3:0" },
          { time: "3:0:1" },
          { time: "3:1:3" },
          { time: "3:2:2" },
          { time: "3:3:0" },
        ],
        loopEnd: "2m"
      }
    }
  ];
  
  return createLoops(LOOP_CONFIGS, targetNode, registerEffect);
};

export default {
  createLoopSynth,
  createEffectsChain,
  createLoopPattern,
  createLoop,
  createLoops,
  createBuiltinLoops
};
