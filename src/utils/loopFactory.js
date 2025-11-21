import * as Tone from 'tone';
import { LOOP_CONFIGS } from '../constants/loopConfigs';

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
      case 'Volume':
        effectNode = new Tone.Volume(...options);
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
  return createLoops(LOOP_CONFIGS, targetNode, registerEffect);
};

const LoopFactory = {
  createLoopSynth,
  createEffectsChain,
  createLoopPattern,
  createLoop,
  createLoops,
  createBuiltinLoops
};

export default LoopFactory;
