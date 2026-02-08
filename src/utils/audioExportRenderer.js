import * as Tone from 'tone';
import {
  createDrumAudioGraph,
  createDrumSynths,
  scheduleDrumPattern,
  setupProgressTracking,
  validateExportOptions
} from './audioExportBuilder';

/**
 * Renders audio offline with support for both simple (drums only) and complex (drums + loops) modes
 * @param {Object} options - Render configuration
 * @param {Array} options.drumSounds - Drum instrument definitions
 * @param {number} options.bpm - Beats per minute
 * @param {number} options.stepCount - Pattern length in steps
 * @param {Object} options.pattern - Drum pattern data
 * @param {Object} options.drumVolumes - Per-drum volume settings
 * @param {number} options.masterVolume - Master volume
 * @param {number} options.filterFreq - Filter frequency
 * @param {number} options.filterQ - Filter Q value
 * @param {Function} options.progressCallback - Optional progress callback
 * @param {Array} options.loops - Optional loop configurations for complex mode
 * @param {boolean} options.includeLoops - Whether to include loops (complex mode)
 * @param {number} options.duration - Total render duration in seconds
 * @returns {Promise<Object>} Rendered audio buffer
 */
export const renderAudioOffline = async (options) => {
  const validatedOptions = validateExportOptions(options);
  const {
    drumSounds,
    bpm,
    stepCount,
    pattern,
    drumVolumes,
    masterVolume,
    filterFreq,
    filterQ,
    progressCallback,
    loops = [],
    includeLoops = false,
    duration = 30
  } = validatedOptions;

  return await Tone.Offline(({ transport }) => {
    // Handle progress tracking
    if (progressCallback) {
      setupProgressTracking(transport, duration, progressCallback);
    }

    // Create master audio graph
    const { filterNode } = createDrumAudioGraph(
      { masterVolume, filterFreq, filterQ },
      Tone.Destination
    );

    // Create drum synths and schedule patterns
    const { synths: drumSynths } = createDrumSynths(
      drumSounds,
      drumVolumes,
      filterNode
    );

    // Schedule drum pattern
    scheduleDrumPattern(
      drumSounds,
      pattern,
      drumSynths,
      transport,
      bpm,
      stepCount,
      duration
    );

    // Add loops in complex mode
    if (includeLoops && loops.length > 0) {
      addLoopsToRender(loops, filterNode, transport, duration);
    }

    // Transport setup
    transport.bpm.value = bpm;
    transport.start(0).stop(duration);

  }, duration);
};

/**
 * Adds loops to the render in complex mode
 * @param {Array} loops - Loop configurations
 * @param {Object} targetNode - Node to connect loops to
 * @param {Object} transport - Tone.Transport instance
 * @param {number} duration - Total duration
 */
const addLoopsToRender = (loops, targetNode, transport, duration) => {
  // For each loop, create synth and schedule pattern
  loops.forEach((loopConfig, index) => {
    if (!loopConfig || !loopConfig.enabled) return;

    try {
      const { synth, pattern } = createLoopSynthAndPattern(loopConfig, targetNode);
      
      if (synth && pattern) {
        pattern.start(0);
        transport.schedule((time) => {
          // Loop-specific logic here if needed
        }, [duration]);
      }
    } catch (error) {
      console.warn(`Error adding loop ${index}:`, error);
    }
  });
};

/**
 * Creates synth and pattern for a single loop
 * @param {Object} loopConfig - Loop configuration
 * @param {Object} targetNode - Node to connect to
 * @returns {Object} Object containing synth and pattern
 */
const createLoopSynthAndPattern = (loopConfig, targetNode) => {
  const { type, notes, pattern: patternData } = loopConfig;

  // Create synth based on type
  let synth;
  switch (type) {
    case 'fm':
      synth = new Tone.FMSynth().connect(targetNode);
      break;
    case 'mono':
      synth = new Tone.MonoSynth().connect(targetNode);
      break;
    case 'poly':
      synth = new Tone.PolySynth(Tone.Synth).connect(targetNode);
      break;
    default:
      synth = new Tone.Synth().connect(targetNode);
  }

  // Create pattern based on data
  let pattern;
  if (Array.isArray(notes)) {
    // Simple note array pattern
    pattern = new Tone.Sequence((time, note) => {
      if (note) {
        synth.triggerAttackRelease(note, '8n', time);
      }
    }, notes).start(0);
  } else if (patternData && typeof patternData === 'object') {
    // Complex pattern object
    pattern = new Tone.Part((time, value) => {
      if (value.note) {
        synth.triggerAttackRelease(value.note, value.duration || '8n', time);
      } else if (value.notes) {
        synth.triggerAttackRelease(value.notes, value.duration || '2n', time);
      }
    }, patternData).start(0);
    
    if (pattern) {
      pattern.loop = true;
      pattern.loopEnd = '2m'; // Default 2 measures
    }
  }

  return { synth, pattern };
};

/**
 * Calculates the total duration for export based on mode
 * @param {Object} options - Options including bpm, stepCount, durationMode, durationValue
 * @returns {number} Duration in seconds
 */
export const calculateExportDuration = (options) => {
  const {
    bpm,
    stepCount,
    durationMode,
    durationValue
  } = options;

  const patternLengthInSeconds = (stepCount / 4) * (60 / bpm);

  if (durationMode === 'rounds') {
    const rounds = parseInt(durationValue, 10);
    return patternLengthInSeconds * rounds;
  } else {
    return parseInt(durationValue, 10);
  }
};

/**
 * Validates render options
 * @param {Object} options - Options to validate
 * @returns {Object} Validated options with errors array
 */
export const validateRenderOptions = (options) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!options.drumSounds || !Array.isArray(options.drumSounds)) {
    errors.push('drumSounds must be a non-empty array');
  }

  if (!options.pattern || typeof options.pattern !== 'object') {
    errors.push('pattern must be an object');
  }

  if (!Number.isFinite(options.bpm) || options.bpm <= 0) {
    errors.push('bpm must be a positive number');
  }

  if (!Number.isFinite(options.stepCount) || options.stepCount <= 0) {
    errors.push('stepCount must be a positive number');
  }

  // Validate loops if included
  if (options.includeLoops && options.loops) {
    options.loops.forEach((loop, index) => {
      if (loop && loop.enabled && !loop.type) {
        warnings.push(`Loop ${index} enabled but has no type`);
      }
    });
  }

  // Warnings for edge cases
  if (options.duration > 300) { // 5 minutes
    warnings.push('Duration longer than 5 minutes may cause memory issues');
  }

  if (options.bpm > 300 || options.bpm < 40) {
    warnings.push('BPM outside typical range (40-300)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    options: {
      ...options,
      // Apply sensible defaults
      duration: options.duration || 30,
      includeLoops: options.includeLoops || false,
      progressCallback: options.progressCallback || null
    }
  };
};

/**
 * Creates a WAV blob from an AudioBuffer
 * @param {AudioBuffer} audioBuffer - Audio buffer to encode
 * @returns {Blob} WAV format blob
 */
export const encodeWAV = (audioBuffer) => {
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  const channels = [];
  let offset = 0;
  let pos = 0;

  const setUint16 = (data) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(36 + length); // file length
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // format chunk length
  setUint16(1); // PCM format
  setUint16(numberOfChannels); // channels
  setUint32(sampleRate); // sample rate
  setUint32(sampleRate * numberOfChannels * 2); // byte rate
  setUint16(numberOfChannels * 2); // block align
  setUint16(16); // bits per sample
  setUint32(0x61746164); // "data"
  setUint32(length); // data chunk length

  // Get channel data
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  // Write interleaved audio data
  while (offset < audioBuffer.length) {
    for (let i = 0; i < numberOfChannels; i++) {
      const sample = Math.max(-1, Math.min(1, channels[i][offset]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, int16, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

/**
 * Downloads a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename for download
 */
export const downloadAudioFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

// Default export
const audioExportRenderer = {
  renderAudioOffline,
  calculateExportDuration,
  validateRenderOptions,
  encodeWAV,
  downloadAudioFile
};

export default audioExportRenderer;
