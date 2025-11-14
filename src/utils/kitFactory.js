import * as Tone from 'tone';

/**
 * Effect node creators map
 * Each effect type has a factory function that creates the effect
 */
const EFFECT_CREATORS = {
  'Filter': (options) => {
    const [config] = options;
    return new Tone.Filter(config);
  },
  
  'BitCrusher': (options) => {
    const [config] = options;
    return new Tone.BitCrusher(config);
  },
  
  'Distortion': (options) => {
    const [config] = options;
    return new Tone.Distortion(config);
  }
};

/**
 * Synth node creators map
 */
const SYNTH_CREATORS = {
  'MembraneSynth': (options) => {
    return new Tone.MembraneSynth(options);
  },
  
  'NoiseSynth': (options) => {
    return new Tone.NoiseSynth(options);
  }
};

/**
 * Creates all drum synths for a kit configuration
 * @param {Object} kitConfig - Kit configuration from KITS_CONFIG
 * @param {AudioNode} destinationNode - Node to connect the final output to
 * @param {Function} registerEffectNode - Callback to register effect nodes for cleanup
 * @returns {Object} Object containing synths, drumVolumes, velocityShapes, and effect nodes
 */
export const createKitSynths = (kitConfig, destinationNode, registerEffectNode) => {
  if (!kitConfig || !kitConfig.drums) {
    throw new Error('Invalid kit configuration: missing drums definition');
  }

  const synths = {};
  const drumVolumes = {};
  const effectNodes = [];
  const velocityShapes = kitConfig.velocityShapes || {};
  
  // Apply kit-level master volume if specified
  const masterVolume = kitConfig.masterVolume !== undefined ? kitConfig.masterVolume : -10;

  // Create each drum sound
  Object.entries(kitConfig.drums).forEach(([drumName, drumConfig]) => {
    try {
      // Create volume node for this drum using kit's master volume
      const volNode = new Tone.Volume(masterVolume);
      drumVolumes[drumName] = volNode;

      // Create the synth
      const synthCreator = SYNTH_CREATORS[drumConfig.type];
      if (!synthCreator) {
        throw new Error(`Unknown synth type: ${drumConfig.type}`);
      }

      const synth = synthCreator(drumConfig.options);
      synths[drumName] = synth;

      // Build effect chain if defined
      let lastNode = synth;
      
      if (drumConfig.effects && Array.isArray(drumConfig.effects)) {
        drumConfig.effects.forEach((effectConfig, index) => {
          const effectCreator = EFFECT_CREATORS[effectConfig.type];
          if (!effectCreator) {
            throw new Error(`Unknown effect type: ${effectConfig.type}`);
          }

          const effectNode = effectCreator(effectConfig.options);
          effectNodes.push(effectNode);

          if (registerEffectNode) {
            registerEffectNode(effectNode);
          }

          // Connect synth/effect to effect
          lastNode.connect(effectNode);
          lastNode = effectNode;
        });
      }

      // Connect final node to volume, then to destination
      lastNode.connect(volNode);
      volNode.connect(destinationNode);

    } catch (error) {
      console.error(`Error creating drum ${drumName}:`, error);
      // Create a fallback noise synth if something fails
      const fallbackSynth = new Tone.NoiseSynth();
      const volNode = new Tone.Volume(masterVolume);
      drumVolumes[drumName] = volNode;
      synths[drumName] = fallbackSynth;
      fallbackSynth.connect(volNode);
      volNode.connect(destinationNode);
    }
  });

  return {
    synths,
    drumVolumes,
    velocityShapes,
    effectNodes
  };
};

/**
 * Disposes all synths and effect nodes for cleanup
 * @param {Object} kitSynths - Object returned from createKitSynths
 */
export const disposeKitSynths = (kitSynths) => {
  if (!kitSynths) return;

  const { synths, drumVolumes, effectNodes } = kitSynths;

  // Dispose synths
  if (synths) {
    Object.values(synths).forEach(synth => {
      try {
        if (synth && typeof synth.dispose === 'function') {
          synth.dispose();
        }
      } catch (error) {
        console.error('Error disposing synth:', error);
      }
    });
  }

  // Dispose volume nodes
  if (drumVolumes) {
    Object.values(drumVolumes).forEach(vol => {
      try {
        if (vol && typeof vol.dispose === 'function') {
          vol.dispose();
        }
      } catch (error) {
        console.error('Error disposing volume node:', error);
      }
    });
  }

  // Dispose effect nodes
  if (effectNodes) {
    effectNodes.forEach(node => {
      try {
        if (node && typeof node.dispose === 'function') {
          node.dispose();
        }
      } catch (error) {
        console.error('Error disposing effect node:', error);
      }
    });
  }
};

/**
 * Gets velocity value for a drum sound at a specific step
 * @param {Object} velocityShapes - Velocity shapes from kit config
 * @param {string} drumName - Name of the drum
 * @param {number} step - Current step index
 * @returns {number} Velocity value (0.0 to 1.0)
 */
export const getVelocityForStep = (velocityShapes, drumName, step) => {
  const shape = velocityShapes?.[drumName];
  if (!shape || !Array.isArray(shape) || shape.length === 0) {
    return 1.0; // Default to full velocity
  }

  // Cycle through the velocity shape pattern
  return shape[step % shape.length];
};

const kitFactory = {
  createKitSynths,
  disposeKitSynths,
  getVelocityForStep
};

export default kitFactory;
