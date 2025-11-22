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
 * Creates a Tone.Player for user-uploaded audio files
 * @param {string} userLoopUrl - Blob URL for user-uploaded audio file
 * @returns {Object} Created Tone.Player instance
 */
export const createLoopPlayer = (userLoopUrl) => {
  if (!userLoopUrl) {
    throw new Error('User loop URL is required for player creation');
  }
  
  // Create player with looping enabled
  const player = new Tone.Player({
    url: userLoopUrl,
    autostart: false,
    loop: true
  });
  
  return player;
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
 * Creates a user loop with Tone.Player and control interface
 * @param {string} userLoopUrl - Blob URL for user-uploaded audio file
 * @param {Object} targetNode - Target node to connect output to
 * @returns {Object} Object containing playerRef and controlRef
 */
export const createUserLoop = (userLoopUrl, targetNode) => {
  const player = createLoopPlayer(userLoopUrl);
  
  // Connect player to target
  player.connect(targetNode);
  
  // Create control interface compatible with existing loop system
  const control = {
    start: (time) => player.start(time),
    stop: (time) => player.stop(time),
    dispose: () => player.dispose(),
    mute: false
  };
  
  return {
    playerRef: { current: player },
    controlRef: { current: control }
  };
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
 * Creates a complete loop (synth or player, effects, pattern)
 * @param {Object} loopConfig - Loop configuration from LOOP_CONFIGS
 * @param {Object} targetNode - Target node to connect output to
 * @param {Function} registerEffect - Callback to register effect nodes for cleanup
 * @param {string} userLoopUrl - Optional blob URL for user-uploaded WAV file
 * @returns {Object} Object containing synthRef and loopRef
 */
export const createLoop = (loopConfig, targetNode, registerEffect = () => {}, userLoopUrl = null) => {
  if (!loopConfig) {
    throw new Error('Loop configuration is required');
  }
  
  const { id, synthConfig, effects, pattern } = loopConfig;
  
  try {
    let synth;
    
    // Create either a Tone.Player for uploaded files or a synth for default loops
    if (userLoopUrl) {
      synth = createLoopPlayer(userLoopUrl);
    } else {
      synth = createLoopSynth(synthConfig);
    }
    
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
    
    // Connect synth/player to effects chain
    if (synth && finalNode) {
      synth.connect(finalNode);
    }
    
    // For Tone.Player, we need a different looping approach since it handles looping internally
    let loopPart;
    if (userLoopUrl) {
      // Tone.Player handles looping internally and has its own start/stop methods
      // Create a compatible interface for controlling playback
      loopPart = {
        start: (time) => synth.start(time),
        stop: (time) => synth.stop(time),
        dispose: () => synth.dispose(),
        mute: false,
        loop: true,
        loopEnd: pattern.loopEnd || "2m"
      };
    } else {
      // Create pattern for synth-based loops
      loopPart = createLoopPattern(pattern, synth);
    }
    
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
 * @param {Array} userLoopUrls - Optional array of blob URLs for user-uploaded files
 * @returns {Object} Object with arrays of synthRefs and loopRefs
 */
export const createLoops = (loopConfigs, targetNode, registerEffect = () => {}, userLoopUrls = []) => {
  const synthRefs = [];
  const loopRefs = [];
  
  loopConfigs.forEach((config, index) => {
    const userLoopUrl = userLoopUrls[index] || null;
    const { synthRef, loopRef } = createLoop(config, targetNode, registerEffect, userLoopUrl);
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
 * @param {Array} userLoopUrls - Optional array of blob URLs for user-uploaded files
 * @returns {Object} Object with synthRefs and loopRefs for loops 1-6
 */
export const createBuiltinLoops = (targetNode, registerEffect = () => {}, userLoopUrls = []) => {
  return createLoops(LOOP_CONFIGS, targetNode, registerEffect, userLoopUrls);
};

const LoopFactory = {
  createLoopSynth,
  createEffectsChain,
  createLoopPattern,
  createLoop,
  createLoops,
  createBuiltinLoops,
  createLoopPlayer,
  createUserLoop
};

export default LoopFactory;
