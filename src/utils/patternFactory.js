import { DEFAULTS } from '../constants/config';
import { createEmptyPattern } from './patternBuilder';

/**
 * Pattern template configuration
 * Each template defines a pattern using a compact format
 */
const PATTERN_TEMPLATES = {
  'Empty': (drumSounds, stepCount) => createEmptyPattern(drumSounds, stepCount),
  
  'Rock Beat': (drumSounds, stepCount) => {
    const pattern = createEmptyPattern(drumSounds, stepCount);
    
    // Kick on beats 1, 2, 3, 4 (every 4 steps)
    const kickInterval = Math.max(1, stepCount / 4);
    const kickSteps = Array.from({ length: 4 }, (_, i) => Math.floor(i * kickInterval));
    
    // Snare on beats 2 and 4
    const snareSteps = [Math.floor(kickInterval), Math.floor(3 * kickInterval)];
    
    // Hats on every 8th note (all steps)
    const hatSteps = Array.from({ length: stepCount }, (_, i) => i);
    
    // Apply to pattern - only set if drum exists
    kickSteps.forEach(step => {
      if (pattern['Kick'] && step < stepCount) pattern['Kick'][step] = true;
    });
    snareSteps.forEach(step => {
      if (pattern['Snare'] && step < stepCount) pattern['Snare'][step] = true;
    });
    hatSteps.forEach(step => {
      if (pattern['Closed Hi-Hat'] && step < stepCount) pattern['Closed Hi-Hat'][step] = true;
    });
    if (pattern['Crash']) pattern['Crash'][0] = true; // Crash on beat 1
    
    return pattern;
  },
  
  'Hip-Hop': (drumSounds, stepCount) => {
    const pattern = createEmptyPattern(drumSounds, stepCount);
    
    const interval = stepCount / 16; // Scale based on 16-step pattern
    
    // Kick on 1, 7, 13 (syncopated) - scale to current step count
    const kickSteps = [0, Math.floor(6 * interval), Math.floor(12 * interval)]
      .filter(step => step < stepCount);
    
    // Snare on beats 2 and 4
    const snareSteps = [Math.floor(4 * interval), Math.floor(12 * interval)]
      .filter(step => step < stepCount);
    
    // Hats on off-beats (every other step)
    const hatSteps = Array.from({ length: stepCount }, (_, i) => i).filter(i => i % 2 === 1);
    
    kickSteps.forEach(step => {
      if (pattern['Kick'] && step < stepCount) pattern['Kick'][step] = true;
    });
    snareSteps.forEach(step => {
      if (pattern['Snare'] && step < stepCount) pattern['Snare'][step] = true;
    });
    hatSteps.forEach(step => {
      if (pattern['Closed Hi-Hat'] && step < stepCount) pattern['Closed Hi-Hat'][step] = true;
    });
    
    return pattern;
  },
  
  'Techno': (drumSounds, stepCount) => {
    const pattern = createEmptyPattern(drumSounds, stepCount);
    
    const interval = stepCount / 16; // Scale based on 16-step pattern
    
    // Kick on every beat (every 4 steps in 16-step pattern)
    const kickInterval = Math.max(1, stepCount / 4);
    const kickSteps = Array.from({ length: 4 }, (_, i) => Math.floor(i * kickInterval));
    
    // Snare on off-beats (techno style) - 2, 6, 10, 14
    const snareSteps = [Math.floor(2 * interval), Math.floor(6 * interval), 
                       Math.floor(10 * interval), Math.floor(14 * interval)]
      .filter(step => step < stepCount);
    
    // Hats on every step
    const hatSteps = Array.from({ length: stepCount }, (_, i) => i);
    
    kickSteps.forEach(step => {
      if (pattern['Kick'] && step < stepCount) pattern['Kick'][step] = true;
    });
    snareSteps.forEach(step => {
      if (pattern['Snare'] && step < stepCount) pattern['Snare'][step] = true;
    });
    hatSteps.forEach(step => {
      if (pattern['Closed Hi-Hat'] && step < stepCount) pattern['Closed Hi-Hat'][step] = true;
    });
    
    return pattern;
  },
  
  'Breakbeat': (drumSounds, stepCount) => {
    const pattern = createEmptyPattern(drumSounds, stepCount);
    const interval = stepCount / 16;
    
    // Complex syncopation typical of breakbeats
    const kickSteps = [Math.floor(0 * interval), Math.floor(6 * interval), 
                      Math.floor(9 * interval), Math.floor(14 * interval)]
      .filter(step => step < stepCount);
    
    const snareSteps = [Math.floor(2 * interval), Math.floor(8 * interval), Math.floor(14 * interval)]
      .filter(step => step < stepCount);
    
    // Hats on off-beats
    const hatSteps = Array.from({ length: stepCount }, (_, i) => i).filter(i => i % 2 === 1);
    
    kickSteps.forEach(step => {
      if (pattern['Kick'] && step < stepCount) pattern['Kick'][step] = true;
    });
    snareSteps.forEach(step => {
      if (pattern['Snare'] && step < stepCount) pattern['Snare'][step] = true;
    });
    hatSteps.forEach(step => {
      if (pattern['Closed Hi-Hat'] && step < stepCount) pattern['Closed Hi-Hat'][step] = true;
    });
    
    return pattern;
  },
};

/**
 * Gets all available pattern names
 * @returns {Array<string>} Array of pattern names
 */
export const getPatternNames = () => Object.keys(PATTERN_TEMPLATES);

/**
 * Generates a predefined pattern using the template system
 * @param {string} patternName - Name of the pattern to generate
 * @param {Array} drumSounds - Array of drum sound definitions  
 * @param {number} stepCount - Number of steps for the pattern
 * @returns {Object|null} Generated pattern object or null if pattern doesn't exist
 */
export const generatePattern = (patternName, drumSounds, stepCount) => {
  if (!PATTERN_TEMPLATES[patternName]) {
    console.warn(`Pattern '${patternName}' not found, returning Empty pattern`);
    return createEmptyPattern(drumSounds, stepCount);
  }
  
  try {
    return PATTERN_TEMPLATES[patternName](drumSounds, stepCount);
  } catch (error) {
    console.error(`Error generating pattern '${patternName}':`, error);
    return createEmptyPattern(drumSounds, stepCount);
  }
};

/**
 * Generates all predefined patterns
 * @param {Array} drumSounds - Array of drum sound definitions
 * @param {number} stepCount - Number of steps for the patterns
 * @returns {Object} Object mapping pattern names to pattern objects
 */
export const generateAllPatterns = (drumSounds, stepCount) => {
  const patterns = {};
  
  Object.keys(PATTERN_TEMPLATES).forEach(patternName => {
    patterns[patternName] = generatePattern(patternName, drumSounds, stepCount);
  });
  
  return patterns;
};

/**
 * Creates a custom pattern from a shorthand notation
 * @param {Object} options - Pattern definiton options
 * @param {Object} options.steps - Object mapping drum names to step definitions
 * @param {Array} drumSounds - Array of drum sound definitions
 * @param {number} stepCount - Total number of steps
 * @returns {Object} Generated pattern object
 * @example
 * // Create a simple four-on-the-floor pattern
 * createCustomPattern({
 *   steps: {
 *     'Kick': [0, 4, 8, 12],  // Kick on beats 1-4
 *     'Snare': [4, 12],       // Snare on beats 2 and 4
 *     'Closed Hi-Hat': 'all'  // Hats on every step
 *   }
 * }, drumSounds, 16)
 */
export const createCustomPattern = (options, drumSounds, stepCount) => {
  const { steps = {} } = options;
  const pattern = createEmptyPattern(drumSounds, stepCount);
  
  Object.entries(steps).forEach(([drumName, stepDefinition]) => {
    if (!pattern[drumName]) {
      console.warn(`Drum sound '${drumName}' not found in pattern`);
      return;
    }
    
    if (stepDefinition === 'all') {
      // Fill all steps
      pattern[drumName].fill(true);
    } else if (Array.isArray(stepDefinition)) {
      // Use specific step indices
      stepDefinition.forEach(step => {
        const normalizedStep = step % stepCount;
        if (normalizedStep >= 0 && normalizedStep < stepCount) {
          pattern[drumName][normalizedStep] = true;
        }
      });
    } else if (typeof stepDefinition === 'string') {
      // Handle string patterns like "x...x...x...x..."
      const trimmed = stepDefinition.replace(/\s/g, '');
      for (let i = 0; i < Math.min(trimmed.length, stepCount); i++) {
        pattern[drumName][i] = trimmed[i] === 'x' || trimmed[i] === 'X';
      }
    }
  });
  
  return pattern;
};

/**
 * Scales a pattern to a different step count while preserving the rhythm
 * @param {Object} sourcePattern - Pattern to scale
 * @param {number} sourceStepCount - Current step count
 * @param {number} targetStepCount - Desired step count
 * @returns {Object} Scaled pattern
 */
export const scalePattern = (sourcePattern, sourceStepCount, targetStepCount) => {
  const scaled = {};
  const scaleFactor = targetStepCount / sourceStepCount;
  
  Object.keys(sourcePattern).forEach(drumName => {
    scaled[drumName] = Array(targetStepCount).fill(false);
    
    sourcePattern[drumName].forEach((isActive, index) => {
      if (isActive) {
        const scaledIndex = Math.floor(index * scaleFactor);
        if (scaledIndex < targetStepCount) {
          scaled[drumName][scaledIndex] = true;
        }
      }
    });
  });
  
  return scaled;
};

/**
 * Exports for backward compatibility
 */
export const getPredefinedPatterns = (drumSounds, stepCount = DEFAULTS.STEP_COUNT) => {
  return generateAllPatterns(drumSounds, stepCount);
};

export default {
  PATTERN_TEMPLATES,
  generatePattern,
  generateAllPatterns,
  createCustomPattern,
  scalePattern,
  getPredefinedPatterns,
  getPatternNames,
};
