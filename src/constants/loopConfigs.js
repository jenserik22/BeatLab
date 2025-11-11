/**
 * Loop configuration definitions
 * Each loop is defined as a data structure that can be used by the loop factory
 */

export const LOOP_CONFIGS = [
  {
    id: 'loop1',
    label: 'Synth Arp',
    type: 'melodic',
    
    // Synth configuration
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
    
    // Effect chain configuration
    effects: [
      {
        type: 'FeedbackDelay',
        options: ["8n", 0.5],
        connectTo: 'next' // Connect to next effect or target if last
      },
      {
        type: 'Chorus',
        options: [4, 2.5, 0.5],
        connectTo: 'master'
      }
    ],
    
    // Pattern configuration
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
    
    effects: [], // Direct to master
    
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
      options: {
        attackNoise: 5,
        dampening: 4000,
        resonance: 0.98,
        volume: 5
      }
    },
    
    effects: [
      {
        type: 'Volume',
        options: [10],
        connectTo: 'next'
      },
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
          decay: 0.2,
          sustain: 0.1
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

export default LOOP_CONFIGS;
