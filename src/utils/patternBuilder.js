import { DEFAULTS } from '../constants/config';

/**
 * Builds a normalized pattern data object for saving or sharing
 * @param {Object} pattern - The current pattern object with drum sound arrays
 * @param {Object} options - Configuration options for the pattern
 * @param {number} options.bpm - Beats per minute
 * @param {number} options.stepCount - Number of steps in the pattern
 * @param {Object} options.drumVolumes - Volume settings for each drum sound
 * @param {number} options.masterVolume - Master volume setting
 * @param {number} options.filterFreq - Filter frequency
 * @param {number} options.filterQ - Filter Q value
 * @param {Array<boolean>} options.loopPlaying - Loop enabled states
 * @param {Array<number>} options.loopVolume - Loop volume settings
 * @param {Array} drumSounds - Array of drum sound definitions
 * @returns {Object} Normalized pattern data object
 */
export const buildPatternData = (pattern, options = {}, drumSounds) => {
  const {
    bpm = DEFAULTS.BPM,
    stepCount = DEFAULTS.STEP_COUNT,
    drumVolumes = {},
    masterVolume = DEFAULTS.VOLUME_DB,
    filterFreq = DEFAULTS.FILTER_FREQ,
    filterQ = DEFAULTS.FILTER_Q,
    loopPlaying = [],
    loopVolume = [],
  } = options;

  const patternData = {
    pattern,
    bpm,
    stepCount,
    drumVolumes,
    masterVolume,
    filterFreq,
    filterQ,
  };

  // Add loop data if provided
  if (loopPlaying.length > 0 || loopVolume.length > 0) {
    for (let i = 0; i < 6; i++) {
      patternData[`loop${i + 1}Playing`] = !!loopPlaying[i];
      patternData[`loop${i + 1}Volume`] = Number.isFinite(loopVolume[i]) 
        ? loopVolume[i] 
        : DEFAULTS.VOLUME_DB;
    }
  }

  return normalizePatternData(patternData, drumSounds, stepCount);
};

/**
 * Normalizes pattern data to ensure consistency and handle missing values
 * @param {Object} patternData - The pattern data to normalize
 * @param {Array} drumSounds - Array of drum sound definitions
 * @param {number} stepCount - Expected step count
 * @returns {Object} Normalized pattern data
 */
export const normalizePatternData = (patternData, drumSounds, stepCount) => {
  if (!patternData || typeof patternData !== 'object') {
    throw new Error('Invalid pattern data: must be an object');
  }

  const normalized = { ...patternData };

  // Ensure pattern exists and has all required drum sounds
  if (!normalized.pattern || typeof normalized.pattern !== 'object') {
    normalized.pattern = {};
  }

  // Ensure all drum sounds are present with correct step count
  drumSounds.forEach(sound => {
    if (!Array.isArray(normalized.pattern[sound.name])) {
      normalized.pattern[sound.name] = Array(stepCount).fill(false);
    } else if (normalized.pattern[sound.name].length !== stepCount) {
      // Adjust array length if needed
      const arr = normalized.pattern[sound.name];
      if (arr.length < stepCount) {
        normalized.pattern[sound.name] = [...arr, ...Array(stepCount - arr.length).fill(false)];
      } else {
        normalized.pattern[sound.name] = arr.slice(0, stepCount);
      }
    }
  });

  // Remove any unknown drum sounds from pattern
  const validSoundNames = new Set(drumSounds.map(s => s.name));
  Object.keys(normalized.pattern).forEach(soundName => {
    if (!validSoundNames.has(soundName)) {
      delete normalized.pattern[soundName];
    }
  });

  // Normalize numeric values with defaults
  normalized.bpm = Number.isFinite(normalized.bpm) ? normalized.bpm : DEFAULTS.BPM;
  normalized.stepCount = Number.isFinite(normalized.stepCount) ? normalized.stepCount : stepCount;
  normalized.masterVolume = Number.isFinite(normalized.masterVolume) 
    ? normalized.masterVolume 
    : DEFAULTS.VOLUME_DB;
  normalized.filterFreq = Number.isFinite(normalized.filterFreq) 
    ? normalized.filterFreq 
    : DEFAULTS.FILTER_FREQ;
  normalized.filterQ = Number.isFinite(normalized.filterQ) 
    ? normalized.filterQ 
    : DEFAULTS.FILTER_Q;

  // Normalize drum volumes
  if (!normalized.drumVolumes || typeof normalized.drumVolumes !== 'object') {
    normalized.drumVolumes = {};
  }
  drumSounds.forEach(sound => {
    if (!Number.isFinite(normalized.drumVolumes[sound.name])) {
      normalized.drumVolumes[sound.name] = DEFAULTS.VOLUME_DB;
    }
  });

  // Remove unknown drum volumes
  Object.keys(normalized.drumVolumes).forEach(soundName => {
    if (!validSoundNames.has(soundName)) {
      delete normalized.drumVolumes[soundName];
    }
  });

  // Normalize loop settings
  for (let i = 0; i < 6; i++) {
    const playingKey = `loop${i + 1}Playing`;
    const volumeKey = `loop${i + 1}Volume`;
    
    if (typeof normalized[playingKey] !== 'boolean') {
      normalized[playingKey] = false;
    }
    
    if (!Number.isFinite(normalized[volumeKey])) {
      normalized[volumeKey] = DEFAULTS.VOLUME_DB;
    }
  }

  return normalized;
};

/**
 * Adapts a pattern to a different step count by interpolating or truncating
 * @param {Object} pattern - The pattern to adapt
 * @param {Array} drumSounds - Array of drum sound definitions
 * @param {number} targetStepCount - Desired step count
 * @returns {Object} New pattern object with adapted step counts
 */
export const adaptPatternToStepCount = (pattern, drumSounds, targetStepCount) => {
  if (!pattern || typeof pattern !== 'object') {
    return createEmptyPattern(drumSounds, targetStepCount);
  }

  const adapted = {};
  // Get source step count from first valid pattern
  const firstSound = drumSounds.find(sound => Array.isArray(pattern[sound.name]));
  const sourceStepCount = firstSound ? pattern[firstSound.name].length : targetStepCount;

  drumSounds.forEach(sound => {
    const sourcePattern = pattern[sound.name] || [];
    
    if (sourcePattern.length === targetStepCount) {
      adapted[sound.name] = [...sourcePattern];
    } else if (sourcePattern.length < targetStepCount) {
      // Repeat pattern to fill
      adapted[sound.name] = [
        ...sourcePattern, 
        ...Array(targetStepCount - sourcePattern.length).fill(false)
      ];
    } else {
      // Truncate pattern
      adapted[sound.name] = sourcePattern.slice(0, targetStepCount);
    }
  });

  return adapted;
};

/**
 * Creates an empty pattern with all drum sounds set to false
 * @param {Array} drumSounds - Array of drum sound definitions
 * @param {number} stepCount - Number of steps
 * @returns {Object} Empty pattern object
 */
export const createEmptyPattern = (drumSounds, stepCount) => {
  const emptyPattern = {};
  drumSounds.forEach(sound => {
    emptyPattern[sound.name] = Array(stepCount).fill(false);
  });
  return emptyPattern;
};

/**
 * Validates that a pattern data object is well-formed
 * @param {Object} patternData - Pattern data to validate
 * @param {Array} drumSounds - Expected drum sounds
 * @returns {Object} Validation result with isValid and errors array
 */
export const validatePatternData = (patternData, drumSounds) => {
  const errors = [];
  const warnings = [];

  if (!patternData || typeof patternData !== 'object') {
    return { isValid: false, errors: ['Pattern data must be an object'], warnings: [] };
  }

  // Validate pattern structure
  if (!patternData.pattern || typeof patternData.pattern !== 'object') {
    errors.push('Pattern data must contain a pattern object');
  } else {
    const validSoundNames = new Set(drumSounds.map(s => s.name));
    
    drumSounds.forEach(sound => {
      if (!Array.isArray(patternData.pattern[sound.name])) {
        errors.push(`Pattern for ${sound.name} must be an array`);
      } else if (patternData.pattern[sound.name].some(step => typeof step !== 'boolean')) {
        errors.push(`Pattern for ${sound.name} must contain only boolean values`);
      }
    });

    // Check for unknown drum sounds
    Object.keys(patternData.pattern).forEach(soundName => {
      if (!validSoundNames.has(soundName)) {
        warnings.push(`Unknown drum sound in pattern: ${soundName}`);
      }
    });
  }

  // Validate numeric values
  if (patternData.bpm && (patternData.bpm < 40 || patternData.bpm > 300)) {
    warnings.push(`BPM value ${patternData.bpm} is outside typical range (40-300)`);
  }

  if (patternData.stepCount && (patternData.stepCount < 8 || patternData.stepCount > 64)) {
    warnings.push(`Step count ${patternData.stepCount} is outside typical range (8-64)`);
  }

  // Validate drumVolumes
  if (patternData.drumVolumes && typeof patternData.drumVolumes === 'object') {
    drumSounds.forEach(sound => {
      if (patternData.drumVolumes[sound.name] !== undefined && 
          typeof patternData.drumVolumes[sound.name] !== 'number') {
        errors.push(`Volume for ${sound.name} must be a number`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Extracts a subset of pattern data for sharing (removes redundant information)
 * @param {Object} patternData - Full pattern data object
 * @returns {Object} Compressed pattern data for sharing
 */
export const compressPatternData = (patternData) => {
  const { pattern, bpm, stepCount, drumVolumes = {}, masterVolume, filterFreq, filterQ } = patternData;
  
  const compressed = {
    pattern,
    bpm,
    stepCount,
  };

  // Only include masterVolume if it's not default
  if (Number.isFinite(masterVolume) && masterVolume !== DEFAULTS.VOLUME_DB) {
    compressed.masterVolume = masterVolume;
  }

  // Only include filter settings if they're not default
  if (Number.isFinite(filterFreq) && filterFreq !== DEFAULTS.FILTER_FREQ) {
    compressed.filterFreq = filterFreq;
  }

  if (Number.isFinite(filterQ) && filterQ !== DEFAULTS.FILTER_Q) {
    compressed.filterQ = filterQ;
  }

  // Only include drumVolumes if they're not all default
  const drumVolumeValues = Object.values(drumVolumes);
  if (drumVolumeValues.length > 0) {
    const allDefaultVolumes = drumVolumeValues.every(vol => vol === DEFAULTS.VOLUME_DB);
    if (!allDefaultVolumes) {
      compressed.drumVolumes = drumVolumes;
    }
  }

  // Only include loop data if any loops are enabled or non-default
  const loopsActive = [];
  for (let i = 0; i < 6; i++) {
    const isPlaying = patternData[`loop${i + 1}Playing`];
    const volume = patternData[`loop${i + 1}Volume`];
    
    if (isPlaying || (Number.isFinite(volume) && volume !== DEFAULTS.VOLUME_DB)) {
      loopsActive.push({ i, isPlaying, volume });
    }
  }

  if (loopsActive.length > 0) {
    loopsActive.forEach(({ i, isPlaying, volume }) => {
      compressed[`loop${i + 1}Playing`] = isPlaying;
      if (Number.isFinite(volume) && volume !== DEFAULTS.VOLUME_DB) {
        compressed[`loop${i + 1}Volume`] = volume;
      }
    });
  }

  return compressed;
};
