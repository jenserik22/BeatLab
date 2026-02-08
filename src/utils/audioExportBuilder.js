import * as Tone from 'tone';

/**
 * Creates a standard audio graph for drum export
 * @param {Object} options - Audio graph configuration
 * @param {number} options.masterVolume - Master volume in dB
 * @param {number} options.filterFreq - Filter frequency
 * @param {number} options.filterQ - Filter Q value
 * @param {Object} targetNode - Target node to connect to (usually Destination)
 * @returns {Object} Object containing filterNode and effect registration function
 */
export const createDrumAudioGraph = (options, targetNode) => {
  const { masterVolume = -10, filterFreq = 15000, filterQ = 1 } = options;

  const masterVolNode = new Tone.Volume(masterVolume);
  masterVolNode.connect(targetNode);

  const filterNode = new Tone.Filter(filterFreq, 'lowpass');
  filterNode.connect(masterVolNode);
  filterNode.Q.value = filterQ;

  return {
    filterNode,
    masterVolNode,
    // Function to register nodes for cleanup
    registerNodes: (nodes = []) => {
      return [masterVolNode, filterNode, ...nodes];
    }
  };
};

/**
 * Creates drum synths and connects them to the audio graph
 * @param {Array} drumSounds - Array of drum sound definitions
 * @param {Object} drumVolumes - Volume settings for each drum
 * @param {Object} filterNode - Filter node to connect synths to
 * @returns {Object} Object containing created synths and volume nodes
 */
export const createDrumSynths = (drumSounds, drumVolumes, filterNode) => {
  const synths = {};
  const volumeNodes = {};

  drumSounds.forEach(sound => {
    const volValue = drumVolumes?.[sound.name] || -10;
    const volNode = new Tone.Volume(volValue).connect(filterNode);
    volumeNodes[sound.name] = volNode;

    if (sound.type === 'membrane') {
      synths[sound.name] = new Tone.MembraneSynth({
        envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.1 }
      }).connect(volNode);
    } else if (sound.type === 'noise') {
      synths[sound.name] = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 }
      }).connect(volNode);
    }
  });

  return { synths, volumeNodes };
};

/**
 * Schedules drum pattern notes on the transport
 * @param {Array} drumSounds - Drum sound definitions
 * @param {Object} pattern - Pattern data
 * @param {Object} synths - Synth instances
 * @param {Object} transport - Tone.Transport instance
 * @param {number} bpm - Beats per minute
 * @param {number} stepCount - Number of steps
 * @param {number} duration - Total duration in seconds
 */
export const scheduleDrumPattern = (
  drumSounds,
  pattern,
  synths,
  transport,
  bpm,
  stepCount,
  duration
) => {
  const patternLengthInSeconds = (stepCount / 4) * (60 / bpm);
  const targetRounds = Math.max(1, Math.ceil(duration / patternLengthInSeconds));
  const sixteenthNoteDuration = 60 / (bpm * 4);

  // Schedule all drum notes
  for (let round = 0; round < targetRounds; round++) {
    drumSounds.forEach((sound) => {
      const soundPattern = pattern?.[sound.name];
      if (soundPattern && Array.isArray(soundPattern)) {
        soundPattern.forEach((isActive, stepIndex) => {
          if (isActive) {
            const stepTime = round * patternLengthInSeconds + stepIndex * sixteenthNoteDuration;

            if (sound.type === 'membrane') {
              synths[sound.name].triggerAttackRelease(sound.note, '8n', stepTime);
            } else if (sound.type === 'noise') {
              synths[sound.name].triggerAttackRelease('8n', stepTime);
            }
          }
        });
      }
    });
  }

  transport.bpm.value = bpm;
};

/**
 * Sets up progress tracking for audio export
 * @param {Object} transport - Tone.Transport instance
 * @param {number} duration - Total duration in seconds
 * @param {Function} progressCallback - Callback with progress percentage
 */
export const setupProgressTracking = (transport, duration, progressCallback) => {
  if (!progressCallback) return;

  transport.schedule((time) => {
    const progress = (time / duration) * 100;
    progressCallback(Math.min(progress, 99));
  }, [duration]);
};

/**
 * Main render function for drum pattern export
 * @param {Object} options - Export configuration
 * @param {Array} options.drumSounds - Drum instrument definitions
 * @param {number} options.bpm - Beats per minute
 * @param {number} options.stepCount - Pattern length in steps
 * @param {Object} options.pattern - Drum pattern data
 * @param {Object} options.drumVolumes - Per-drum volume settings
 * @param {number} options.masterVolume - Master volume
 * @param {number} options.filterFreq - Filter frequency
 * @param {number} options.filterQ - Filter Q value
 * @param {Function} options.progressCallback - Optional progress callback
 * @returns {Promise<Object>} Promise resolving to rendered audio buffer
 */
export const renderDrumsOffline = async (options) => {
  const {
    drumSounds,
    bpm,
    stepCount,
    pattern,
    drumVolumes,
    masterVolume,
    filterFreq,
    filterQ,
    progressCallback
  } = options;

  return await Tone.Offline(({ transport }) => {
    // Create audio graph
    const { filterNode } = createDrumAudioGraph(
      { masterVolume, filterFreq, filterQ },
      Tone.Destination
    );

    // Create drum synths
    const { synths } = createDrumSynths(
      drumSounds,
      drumVolumes,
      filterNode
    );

    // Schedule drum pattern
    scheduleDrumPattern(
      drumSounds,
      pattern,
      synths,
      transport,
      bpm,
      stepCount,
      transport.duration || 30 // Default 30 seconds if not specified
    );

    // Setup progress tracking
    if (progressCallback && transport.duration) {
      setupProgressTracking(transport, transport.duration, progressCallback);
    }

    // Start and stop transport
    transport.start(0).stop(transport.duration || 30);

  }, options.duration || 30); // 30 second default
};

/**
 * Validates export options and provides defaults
 * @param {Object} options - Export options to validate
 * @returns {Object} Validated options with defaults applied
 */
export const validateExportOptions = (options) => {
  const {
    drumSounds,
    bpm = 120,
    stepCount = 16,
    pattern = {},
    drumVolumes = {},
    masterVolume = -10,
    filterFreq = 15000,
    filterQ = 1,
    duration = 30
  } = options;

  // Validate required parameters
  if (!Array.isArray(drumSounds) || drumSounds.length === 0) {
    throw new Error('drumSounds must be a non-empty array');
  }

  if (!pattern || typeof pattern !== 'object') {
    throw new Error('pattern must be an object');
  }

  return {
    drumSounds,
    bpm,
    stepCount,
    pattern,
    drumVolumes,
    masterVolume,
    filterFreq,
    filterQ,
    duration
  };
};

/**
 * Checks if the offline context is available
 * @returns {boolean} True if Tone.Offline is available
 */
export const isOfflineContextAvailable = () => {
  return typeof Tone.Offline === 'function';
};

/**
 * Creates a test tone to verify audio is working
 * @param {Object} context - Tone context
 * @param {string} note - Note to play (default: 'C5')
 * @param {string} duration - Duration (default: '4n')
 */
export const createTestTone = (context, note = 'C5', duration = '4n') => {
  const testSynth = new Tone.Synth().connect(context.Destination);
  testSynth.triggerAttackRelease(note, duration, 0.5);
  return testSynth;
};

// Version for backward compatibility
export const renderOffline = renderDrumsOffline;

// Export all utilities
const audioExportBuilder = {
  createDrumAudioGraph,
  createDrumSynths,
  scheduleDrumPattern,
  setupProgressTracking,
  renderDrumsOffline,
  validateExportOptions,
  isOfflineContextAvailable,
  createTestTone,
  renderOffline
};

export default audioExportBuilder;
