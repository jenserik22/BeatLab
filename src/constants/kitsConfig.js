/**
 * Drum Kit Configuration Definitions
 * Each kit defines synth parameters and effects for all drum sounds
 * Following the same pattern as LOOP_CONFIGS.js
 */

export const KITS_CONFIG = [
  {
    id: 'classic',
    name: 'Classic Kit',
    description: 'Original BeatLab drums - classic electronic sounds',
    defaultBpm: 120,
    defaultSwing: 0,
    defaultFilterFreq: 20000,
    defaultFilterQ: 1,
    masterVolume: -10, // No effects, baseline volume
    demoPattern: 'Rock Beat',
    velocityShapes: {
      'Kick': [1.0, 1.0, 1.0, 1.0], // Uniform
      'Snare': [1.0, 1.0],
      'Closed Hi-Hat': [1.0, 1.0, 1.0, 1.0],
      'Open Hi-Hat': [1.0, 1.0],
      'Clap': [1.0, 1.0],
      'Crash': [1.0],
      'Tom Low': [1.0, 1.0],
      'Tom High': [1.0, 1.0]
    },
    drums: {
      'Kick': {
        type: 'MembraneSynth',
        options: {
          envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.1 }
        },
        effects: []
      },
      'Snare': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 }
        },
        effects: []
      },
      'Closed Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.02 }
        },
        effects: []
      },
      'Open Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.05 }
        },
        effects: []
      },
      'Clap': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 }
        },
        effects: []
      },
      'Crash': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.005, decay: 0.5, sustain: 0.1, release: 0.5 }
        },
        effects: []
      },
      'Tom Low': {
        type: 'MembraneSynth',
        options: {
          envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.1 }
        },
        effects: []
      },
      'Tom High': {
        type: 'MembraneSynth',
        options: {
          envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.1 }
        },
        effects: []
      }
    }
  },
  {
    id: 'lofi-chill',
    name: 'Lo-Fi Chill Kit',
    description: 'Soft kicks, vinyl noise, dusty snares with tape saturation',
    defaultBpm: 85,
    defaultSwing: 0.12,
    defaultFilterFreq: 8000,
    defaultFilterQ: 1.5,
    masterVolume: -6, // Slight boost to compensate for filters/bit-crusher
    demoPattern: 'Hip-Hop',
    velocityShapes: {
      'Kick': [1.0, 0.8, 1.0, 0.7], // 4-beat accent pattern
      'Snare': [1.0, 0.6], // Backbeat accent
      'Closed Hi-Hat': [0.7, 0.5, 0.6, 0.5], // Softer, humanized hats
      'Open Hi-Hat': [1.0, 0.8],
      'Clap': [1.0, 0.7],
      'Crash': [1.0],
      'Tom Low': [0.9, 0.7],
      'Tom High': [0.9, 0.7]
    },
    drums: {
      'Kick': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.05,
          octaves: 6,
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.02,
            decay: 0.5,
            sustain: 0,
            release: 0.3
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 200, type: 'lowpass' }],
            connectTo: 'next'
          },
          {
            type: 'BitCrusher',
            options: [{ bits: 8 }],
            connectTo: 'target'
          }
        ]
      },
      'Snare': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'pink', // Warmer noise for lo-fi
            playbackRate: 0.8
          },
          envelope: {
            attack: 0.005,
            decay: 0.15,
            sustain: 0.01,
            release: 0.1
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 1000, type: 'bandpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Closed Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.02 }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 4000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Open Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.1 }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 3000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Clap': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'pink',
            playbackRate: 1
          },
          envelope: {
            attack: 0.003,
            decay: 0.12,
            sustain: 0.01,
            release: 0.08
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 2000, type: 'bandpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Crash': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'white',
            playbackRate: 0.5
          },
          envelope: {
            attack: 0.005,
            decay: 0.8,
            sustain: 0.1,
            release: 0.8
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 3000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Tom Low': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.08,
          octaves: 3,
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.01,
            decay: 0.4,
            sustain: 0,
            release: 0.15
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 400, type: 'lowpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Tom High': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.06,
          octaves: 4,
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0,
            release: 0.1
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 800, type: 'lowpass' }],
            connectTo: 'target'
          }
        ]
      }
    }
  },
  {
    id: 'trap',
    name: 'Trap Kit',
    description: '808 subs, sharp hats, snappy snares',
    defaultBpm: 140,
    defaultSwing: 0.08,
    defaultFilterFreq: 20000,
    defaultFilterQ: 1,
    masterVolume: -6, // Slight boost to compensate for filters/distortion
    demoPattern: 'Hip-Hop',
    velocityShapes: {
      'Kick': [1.0, 0.9, 1.0, 0.8], // Hard hitting kicks
      'Snare': [1.0, 0.95], // Sharp backbeat
      'Closed Hi-Hat': [0.9, 0.6, 0.8, 0.5, 0.9, 0.6, 0.8, 0.5], // Trap-style hat rolls
      'Open Hi-Hat': [1.0, 0.7],
      'Clap': [1.0, 0.9],
      'Crash': [1.0, 0.8],
      'Tom Low': [1.0, 0.85],
      'Tom High': [1.0, 0.85]
    },
    drums: {
      'Kick': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.03,
          octaves: 10, // Deep 808-style
          oscillator: {
            type: 'sawtooth' // Rich harmonics
          },
          envelope: {
            attack: 0.001,
            decay: 0.3,
            sustain: 0,
            release: 0.2
          }
        },
        effects: [
          {
            type: 'Distortion',
            options: [{ distortion: 0.1 }],
            connectTo: 'next'
          },
          {
            type: 'Filter',
            options: [{ frequency: 150, type: 'lowpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Snare': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'white',
            playbackRate: 1.2
          },
          envelope: {
            attack: 0.001,
            decay: 0.08,
            sustain: 0.01,
            release: 0.03
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 3000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Closed Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.02 }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 5000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Open Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.05 }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 4000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Clap': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'white',
            playbackRate: 1.5
          },
          envelope: {
            attack: 0.002,
            decay: 0.1,
            sustain: 0.01,
            release: 0.05
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 2500, type: 'bandpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Crash': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'white',
            playbackRate: 0.6
          },
          envelope: {
            attack: 0.003,
            decay: 0.6,
            sustain: 0.1,
            release: 0.6
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 4000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Tom Low': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.06,
          octaves: 4,
          oscillator: {
            type: 'triangle'
          },
          envelope: {
            attack: 0.005,
            decay: 0.3,
            sustain: 0,
            release: 0.1
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 300, type: 'lowpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Tom High': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.05,
          octaves: 5,
          oscillator: {
            type: 'triangle'
          },
          envelope: {
            attack: 0.005,
            decay: 0.25,
            sustain: 0,
            release: 0.08
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 600, type: 'lowpass' }],
            connectTo: 'target'
          }
        ]
      }
    }
  },
  {
    id: 'boom-bap-90s',
    name: 'Boom Bap 90s Kit',
    description: 'Crunchy drums, SP-1200 grit, classic hip-hop sound',
    defaultBpm: 95,
    defaultSwing: 0.18, // Classic 90s swing
    defaultFilterFreq: 12000,
    defaultFilterQ: 1.2,
    masterVolume: -6, // Slight boost to compensate for filters/distortion
    demoPattern: 'Hip-Hop',
    velocityShapes: {
      'Kick': [1.0, 0.7, 1.0, 0.8], // Classic boom-bap accents
      'Snare': [1.0, 0.85], // Hard backbeat
      'Closed Hi-Hat': [0.8, 0.4, 0.7, 0.5], // Slightly behind-the-beat feel
      'Open Hi-Hat': [1.0, 0.9],
      'Clap': [1.0, 0.95],
      'Crash': [1.0, 0.85],
      'Tom Low': [1.0, 0.75],
      'Tom High': [1.0, 0.75]
    },
    drums: {
      'Kick': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.04,
          octaves: 5,
          oscillator: {
            type: 'square' // Adds grit
          },
          envelope: {
            attack: 0.01,
            decay: 0.35,
            sustain: 0,
            release: 0.15
          }
        },
        effects: [
          {
            type: 'Distortion',
            options: [{ distortion: 0.2 }],
            connectTo: 'next'
          },
          {
            type: 'Filter',
            options: [{ frequency: 200, type: 'lowpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Snare': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'pink',
            playbackRate: 0.9
          },
          envelope: {
            attack: 0.003,
            decay: 0.12,
            sustain: 0.01,
            release: 0.06
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 2500, type: 'bandpass' }],
            connectTo: 'next'
          },
          {
            type: 'Distortion',
            options: [{ distortion: 0.1 }],
            connectTo: 'target'
          }
        ]
      },
      'Closed Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.02 }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 3500, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Open Hi-Hat': {
        type: 'NoiseSynth',
        options: {
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.1 }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 3000, type: 'highpass' }],
            connectTo: 'target'
          }
        ]
      },
      'Clap': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'pink',
            playbackRate: 1.2
          },
          envelope: {
            attack: 0.004,
            decay: 0.1,
            sustain: 0.01,
            release: 0.06
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 1800, type: 'bandpass' }],
            connectTo: 'next'
          },
          {
            type: 'Distortion',
            options: [{ distortion: 0.15 }],
            connectTo: 'target'
          }
        ]
      },
      'Crash': {
        type: 'NoiseSynth',
        options: {
          noise: {
            type: 'white',
            playbackRate: 0.7
          },
          envelope: {
            attack: 0.005,
            decay: 0.7,
            sustain: 0.1,
            release: 0.7
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 3500, type: 'highpass' }],
            connectTo: 'next'
          },
          {
            type: 'Distortion',
            options: [{ distortion: 0.1 }],
            connectTo: 'target'
          }
        ]
      },
      'Tom Low': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.07,
          octaves: 3,
          oscillator: {
            type: 'square'
          },
          envelope: {
            attack: 0.008,
            decay: 0.35,
            sustain: 0,
            release: 0.12
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 350, type: 'lowpass' }],
            connectTo: 'next'
          },
          {
            type: 'Distortion',
            options: [{ distortion: 0.1 }],
            connectTo: 'target'
          }
        ]
      },
      'Tom High': {
        type: 'MembraneSynth',
        options: {
          pitchDecay: 0.06,
          octaves: 4,
          oscillator: {
            type: 'square'
          },
          envelope: {
            attack: 0.008,
            decay: 0.3,
            sustain: 0,
            release: 0.1
          }
        },
        effects: [
          {
            type: 'Filter',
            options: [{ frequency: 700, type: 'lowpass' }],
            connectTo: 'next'
          },
          {
            type: 'Distortion',
            options: [{ distortion: 0.1 }],
            connectTo: 'target'
          }
        ]
      }
    }
  }
];

export const getKitById = (id) => {
  return KITS_CONFIG.find(kit => kit.id === id);
};

export const getDefaultKit = () => {
  return KITS_CONFIG[0]; // Lo-Fi Chill
};

export const getAllKits = () => {
  return [...KITS_CONFIG];
};

const kitsConfig = {
  KITS_CONFIG,
  getKitById,
  getDefaultKit,
  getAllKits
};

export default kitsConfig;
