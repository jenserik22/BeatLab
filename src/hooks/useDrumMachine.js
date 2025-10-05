import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  getCurrentPattern,
  setCurrentPattern,
  getSavedPatterns,
  setSavedPatterns,
  normalizePatternData,
} from '../utils/storage';
import { DEFAULTS, LOOPS_CONFIG } from '../constants/config';
import { getPredefinedPatterns } from '../patterns';
import { getStepCount, setStepCount, adaptPatternToStepCount } from '../utils/storage';
import { encodePattern } from '../utils/url';

const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

export const useDrumMachine = (drumSounds) => {
  const [stepCount, setStepCountState] = useState(getStepCount(DEFAULTS.STEP_COUNT));
  const createEmptyPattern = () => {
    const emptyPattern = {};
    drumSounds.forEach(sound => {
      emptyPattern[sound.name] = Array(stepCount).fill(false);
    });
    return emptyPattern;
  };

  const predefinedPatterns = {
    'Empty': createEmptyPattern(),
    'Rock Beat': {
      'Kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'Snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'Closed Hi-Hat': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      'Open Hi-Hat': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Crash': [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom Low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom High': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    'Hip-Hop': {
      'Kick': [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      'Snare': [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      'Closed Hi-Hat': [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      'Open Hi-Hat': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Crash': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom Low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom High': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    'Techno': {
      'Kick': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      'Snare': [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      'Closed Hi-Hat': [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      'Open Hi-Hat': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Crash': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom Low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom High': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    'Breakbeat': {
      'Kick': [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      'Snare': [false, false, true, false, false, false, false, false, true, false, false, false, false, false, true, false],
      'Closed Hi-Hat': [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      'Open Hi-Hat': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Clap': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Crash': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom Low': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      'Tom High': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  };

  const [pattern, setPattern] = useState(() => getCurrentPattern(drumSounds, stepCount));

  const [bpm, setBpm] = useState(DEFAULTS.BPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [currentPatternName, setCurrentPatternName] = useState('Empty');
  const [savedPatterns, setSavedPatternsState] = useState(() => getSavedPatterns(drumSounds));

  // Refs for Tone.js instruments
  const synths = useRef({});
  const sequenceRef = useRef(null); // Ref to store the Tone.Sequence instance
  const effectNodesRef = useRef([]);

  // Use a ref to store the latest pattern state for the Tone.Sequence callback
  const patternRef = useRef(pattern);
  useEffect(() => {
    patternRef.current = pattern;
    setCurrentPattern(pattern);
  }, [pattern]);

  const [drumVolumes, setDrumVolumes] = useState(() => {
    const initialVolumes = {};
    drumSounds.forEach(sound => {
      initialVolumes[sound.name] = DEFAULTS.VOLUME_DB;
    });
    return initialVolumes;
  });

  const [masterVolume, setMasterVolume] = useState(DEFAULTS.VOLUME_DB);
  const [loopPlaying, setLoopPlaying] = useState(() => Array(LOOPS_CONFIG.length).fill(false));
  const [loopVolume, setLoopVolume] = useState(() => Array(LOOPS_CONFIG.length).fill(DEFAULTS.VOLUME_DB));
  const loop1Synth = useRef(null);
  const loop1 = useRef(null);

  const loop2Synth = useRef(null);
  const loop2 = useRef(null);

  const loop3Synth = useRef(null);
  const loop3 = useRef(null);

  const loop4Synth = useRef(null);
  const loop4 = useRef(null);

  const loop5Synth = useRef(null);
  const loop5 = useRef(null);

  const loop6Synth = useRef(null);
  const loop6 = useRef(null);

  const loopRefs = [loop1, loop2, loop3, loop4, loop5, loop6];
  const loopSynthRefs = [loop1Synth, loop2Synth, loop3Synth, loop4Synth, loop5Synth, loop6Synth];

  const [filterFreq, setFilterFreq] = useState(DEFAULTS.FILTER_FREQ);
  const [filterQ, setFilterQ] = useState(DEFAULTS.FILTER_Q);

  const masterVol = useRef(null);
  const drumVols = useRef({});
  const filter = useRef(null);
  const analyserRef = useRef(null);

  // Initialize Tone.js instruments once
  useEffect(() => {
    debugLog('Initializing Tone.js instruments...');

    effectNodesRef.current = [];

    const registerEffectNode = (node) => {
      effectNodesRef.current.push(node);
      return node;
    };

    const masterVolumeNode = new Tone.Volume(-10);
    if (typeof masterVolumeNode.toDestination === 'function') {
      masterVolumeNode.toDestination();
    } else if (typeof masterVolumeNode.connect === 'function' && Tone.Destination) {
      masterVolumeNode.connect(Tone.Destination);
    } else {
      debugLog('Skipping Tone initialization: master volume routing unavailable.');
      masterVolumeNode.dispose?.();
      return () => {};
    }
    registerEffectNode(masterVolumeNode);
    masterVol.current = masterVolumeNode;

    filter.current = registerEffectNode(new Tone.Filter(filterFreq, 'lowpass').connect(masterVol.current));
    analyserRef.current = new Tone.Analyser('fft', 256);
    masterVol.current.connect(analyserRef.current);

    drumVols.current = {};
    drumSounds.forEach(sound => {
      drumVols.current[sound.name] = new Tone.Volume(drumVolumes[sound.name]).connect(filter.current);
    });

    synths.current = {
      'Kick': new Tone.MembraneSynth({
        envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.1 }
      }).connect(drumVols.current['Kick']),
      'Snare': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 },
      }).connect(drumVols.current['Snare']),
      'Closed Hi-Hat': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.02 },
      }).connect(drumVols.current['Closed Hi-Hat']),
      'Open Hi-Hat': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.05 },
      }).connect(drumVols.current['Open Hi-Hat']),
      'Clap': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 },
      }).connect(drumVols.current['Clap']),
      'Crash': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.5, sustain: 0.1, release: 0.5 },
      }).connect(drumVols.current['Crash']),
      'Tom Low': new Tone.MembraneSynth({
        envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.1 }
      }).connect(drumVols.current['Tom Low']),
      'Tom High': new Tone.MembraneSynth({
        envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.1 }
      }).connect(drumVols.current['Tom High']),
    };
    debugLog('Tone.js instruments initialized.');

    const chorus = registerEffectNode(new Tone.Chorus(4, 2.5, 0.5).connect(masterVol.current));
    chorus.start();
    const delay = registerEffectNode(new Tone.FeedbackDelay("8n", 0.5).connect(chorus));
    loop1Synth.current = new Tone.FMSynth({
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
    }).connect(delay);

    const arpNotes = ["C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4"];
    const arpPattern = [
      { time: "0:0", note: arpNotes[0], duration: "8n" },
      { time: "0:1", note: arpNotes[1], duration: "16n" },
      { time: "0:2", note: arpNotes[2], duration: "8n" },
      { time: "0:3", note: arpNotes[3], duration: "16n" },
      { time: "1:0", note: arpNotes[4], duration: "8n" },
      { time: "1:1", note: arpNotes[5], duration: "16n" },
      { time: "1:2", note: arpNotes[6], duration: "8n" },
      { time: "1:3", note: arpNotes[7], duration: "16n" },
    ];
    loop1.current = new Tone.Part((time, value) => {
      loop1Synth.current.triggerAttackRelease(value.note, value.duration, time);
    }, arpPattern);
    loop1.current.loop = true;
    loop1.current.loopEnd = "2m";

    loop2Synth.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).connect(masterVol.current);

    const pianoChords = [
      { time: "0:0", notes: ["C4", "E4", "G4"] },
      { time: "0:2", notes: ["G3", "B3", "D4"] },
      { time: "1:0", notes: ["A3", "C4", "E4"] },
      { time: "1:2", notes: ["F3", "A3", "C4"] }
    ];
    loop2.current = new Tone.Part((time, value) => {
      loop2Synth.current.triggerAttackRelease(value.notes, "2n", time);
    }, pianoChords);
    loop2.current.loop = true;
    loop2.current.loopEnd = "2m";

    const technoFilter = registerEffectNode(new Tone.Filter(1200, "lowpass").connect(masterVol.current));
    const technoDistortion = registerEffectNode(new Tone.Distortion(0.4).connect(technoFilter));
    loop3Synth.current = new Tone.MonoSynth({
      oscillator: {
        type: "sawtooth"
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.2,
        release: 0.1
      }
    }).connect(technoDistortion);

    const technoPattern = [
      { time: "0:0", note: "C3", duration: "8n" },
      { time: "0:1.5", note: "C3", duration: "16n" },
      { time: "0:2", note: "G2", duration: "8n" },
      { time: "0:3", note: "G2", duration: "16n" },
      { time: "1:0", note: "C3", duration: "8n" },
      { time: "1:1.5", note: "C3", duration: "16n" },
      { time: "1:2", note: "A2", duration: "8n" },
      { time: "1:3", note: "A2", duration: "16n" },
    ];
    loop3.current = new Tone.Part((time, value) => {
      loop3Synth.current.triggerAttackRelease(value.note, value.duration, time);
    }, technoPattern);
    loop3.current.loop = true;
    loop3.current.loopEnd = "2m";

    const padFilter = registerEffectNode(new Tone.Filter(200, "lowpass").connect(masterVol.current));
    loop4Synth.current = new Tone.PolySynth(Tone.FMSynth, {
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
    }).connect(padFilter);

    const padChords = [
      { time: "0:0", notes: ["C2", "G2", "C3", "E3"] },
      { time: "2:0", notes: ["F2", "C3", "F3", "A3"] },
      { time: "4:0", notes: ["G2", "D3", "G3", "B3"] },
      { time: "6:0", notes: ["E2", "B2", "E3", "G#3"] }
    ];
    loop4.current = new Tone.Part((time, value) => {
      loop4Synth.current.triggerAttackRelease(value.notes, "4m", time);
    }, padChords);
    loop4.current.loop = true;
    loop4.current.loopEnd = "4m";

    const pluckReverb = registerEffectNode(new Tone.Reverb(5).connect(masterVol.current));
    loop5Synth.current = new Tone.PluckSynth().connect(pluckReverb);

    const pluckNotes = [
      { time: "0:0", note: "C5" },
      { time: "0:1", note: "E5" },
      { time: "0:2", note: "G5" },
      { time: "0:3", note: "B5" },
      { time: "1:0", note: "C6" },
      { time: "1:1", note: "B5" },
      { time: "1:2", note: "G5" },
      { time: "1:3", note: "E5" },
      { time: "2:0", note: "D5" },
      { time: "2:1", note: "F5" },
      { time: "2:2", note: "A5" },
      { time: "2:3", note: "C6" },
      { time: "3:0", note: "B5" },
      { time: "3:1", note: "A5" },
      { time: "3:2", note: "F5" },
      { time: "3:3", note: "D5" }
    ];
    loop5.current = new Tone.Part((time, value) => {
      loop5Synth.current.triggerAttackRelease(value.note, "8n", time);
    }, pluckNotes);
    loop5.current.loop = true;
    loop5.current.loopEnd = "2m";

    const bitCrusher = registerEffectNode(new Tone.BitCrusher(4).connect(masterVol.current));
    loop6Synth.current = new Tone.NoiseSynth({
      noise: {
        type: "white"
      },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0
      }
    }).connect(bitCrusher);

    const glitchPattern = [
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
    ];
    loop6.current = new Tone.Part((time) => {
      loop6Synth.current.triggerAttackRelease("16n", time);
    }, glitchPattern);
    loop6.current.loop = true;
    loop6.current.loopEnd = "2m";

    // Setup Tone.Sequence once
    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        drumSounds.forEach(sound => {
          if (patternRef.current[sound.name][step]) {
            if (sound.type === 'membrane') {
              synths.current[sound.name].triggerAttackRelease(sound.note, '8n', time);
            } else if (sound.type === 'noise') {
              synths.current[sound.name].triggerAttackRelease('8n', time);
            }
          }
        });
      },
      Array.from({ length: stepCount }, (_, i) => i),
      '16n'
    ).start(0);
    debugLog('Tone.Sequence set up.');

    // Set loop points for the transport
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = '4m'; // Loop every 4 measures (16 steps at 16n)

    return () => {
      debugLog('Disposing Tone.js instruments and sequence...');

      Tone.Transport.stop();
      Tone.Transport.cancel(0);

      if (sequenceRef.current) {
        sequenceRef.current.stop();
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }

      loopRefs.forEach(loopRef => {
        if (loopRef.current) {
          loopRef.current.stop(0);
          loopRef.current.dispose();
          loopRef.current = null;
        }
      });

      loopSynthRefs.forEach(loopSynthRef => {
        if (loopSynthRef.current) {
          loopSynthRef.current.dispose();
          loopSynthRef.current = null;
        }
      });

      Object.values(synths.current).forEach(synth => synth.dispose());
      synths.current = {};

      Object.values(drumVols.current).forEach(volumeNode => volumeNode.dispose());
      drumVols.current = {};

      effectNodesRef.current.forEach(node => {
        if (node && typeof node.stop === 'function') {
          try {
            node.stop();
          } catch (err) {
            debugLog('Failed to stop node during cleanup', err);
          }
        }
        node?.dispose?.();
      });
      effectNodesRef.current = [];

      if (analyserRef.current) {
        analyserRef.current.dispose();
        analyserRef.current = null;
      }

      masterVol.current = null;
      filter.current = null;

      debugLog('Disposal complete.');
    };
  }, []); // Empty dependency array: runs once on mount

  // Rebuild sequence when stepCount changes
  useEffect(() => {
    if (!sequenceRef.current) return;
    sequenceRef.current.stop();
    sequenceRef.current.dispose();
    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        drumSounds.forEach(sound => {
          if (patternRef.current[sound.name][step]) {
            if (sound.type === 'membrane') {
              synths.current[sound.name].triggerAttackRelease(sound.note, '8n', time);
            } else if (sound.type === 'noise') {
              synths.current[sound.name].triggerAttackRelease('8n', time);
            }
          }
        });
      },
      Array.from({ length: stepCount }, (_, i) => i),
      '16n'
    ).start(0);
  }, [stepCount, drumSounds]);

  // Update BPM when bpm state changes
  useEffect(() => {
    debugLog('BPM changed to:', bpm);
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const toggleStep = (soundName, stepIndex) => {
    setPattern(prevPattern => ({
      ...prevPattern,
      [soundName]: prevPattern[soundName].map((value, idx) =>
        idx === stepIndex ? !value : value
      ),
    }));
  };

  const handlePlay = () => {
    debugLog('Play button clicked. Transport state:', Tone.Transport.state);
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
      loopRefs.forEach(loopRef => {
        if (loopRef.current) {
          loopRef.current.start(0);
        }
      });
      setIsPlaying(true);
      debugLog('Transport started.');
    }
  };

  const handleStop = useCallback(() => {
    debugLog('Stop button clicked. Transport state:', Tone.Transport.state);
    Tone.Transport.stop();
    loopRefs.forEach(loopRef => {
      if (loopRef.current) {
        loopRef.current.stop(0);
      }
    });
    setIsPlaying(false);
    setCurrentStep(-1); // Reset playhead
    debugLog('Transport stopped.');
  }, []);

  const handleBpmChange = (e) => {
    const newBpm = parseFloat(e.target.value);
    setBpm(newBpm);
  };

  const handleStepCountChange = (e) => {
    const next = parseInt(e.target.value, 10);
    if (!Number.isInteger(next) || next <= 0) return;
    const adapted = adaptPatternToStepCount(patternRef.current, drumSounds, next);
    setPattern(adapted);
    setStepCountState(next);
    setStepCount(next);
  };

  const loadPattern = useCallback((patternName, patternData) => {
    if (patternData.pattern) { // Check for new format
      const target = adaptPatternToStepCount(patternData.pattern, drumSounds, stepCount);
      setPattern(target);
      setDrumVolumes(patternData.drumVolumes);
      setMasterVolume(patternData.masterVolume);
      setFilterFreq(patternData.filterFreq);
      setFilterQ(patternData.filterQ);
      setLoopPlaying([
        !!patternData.loop1Playing,
        !!patternData.loop2Playing,
        !!patternData.loop3Playing,
        !!patternData.loop4Playing,
        !!patternData.loop5Playing,
        !!patternData.loop6Playing,
      ]);
      setLoopVolume([
        Number.isFinite(patternData.loop1Volume) ? patternData.loop1Volume : DEFAULTS.VOLUME_DB,
        Number.isFinite(patternData.loop2Volume) ? patternData.loop2Volume : DEFAULTS.VOLUME_DB,
        Number.isFinite(patternData.loop3Volume) ? patternData.loop3Volume : DEFAULTS.VOLUME_DB,
        Number.isFinite(patternData.loop4Volume) ? patternData.loop4Volume : DEFAULTS.VOLUME_DB,
        Number.isFinite(patternData.loop5Volume) ? patternData.loop5Volume : DEFAULTS.VOLUME_DB,
        Number.isFinite(patternData.loop6Volume) ? patternData.loop6Volume : DEFAULTS.VOLUME_DB,
      ]);
    } else { // For backward compatibility
      setPattern(adaptPatternToStepCount(patternData, drumSounds, stepCount));
    }
    setCurrentPatternName(patternName);
    handleStop(); // Stop playback when changing pattern
  }, [handleStop, drumSounds, stepCount]);

  const savePattern = () => {
    const patternName = prompt('Enter a name for your pattern:');
    if (patternName) {
      const patternData = {
        pattern,
        drumVolumes,
        masterVolume,
        filterFreq,
        filterQ,
        stepCount,
        loop1Playing: !!loopPlaying[0],
        loop1Volume: loopVolume[0],
        loop2Playing: !!loopPlaying[1],
        loop2Volume: loopVolume[1],
        loop3Playing: !!loopPlaying[2],
        loop3Volume: loopVolume[2],
        loop4Playing: !!loopPlaying[3],
        loop4Volume: loopVolume[3],
        loop5Playing: !!loopPlaying[4],
        loop5Volume: loopVolume[4],
        loop6Playing: !!loopPlaying[5],
        loop6Volume: loopVolume[5],
      };
      const normalized = normalizePatternData(patternData, drumSounds, stepCount);
      const newSavedPatterns = { ...savedPatterns, [patternName]: normalized };
      setSavedPatternsState(newSavedPatterns);
      setSavedPatterns(newSavedPatterns);
      setCurrentPatternName(patternName);
      alert(`Pattern "${patternName}" saved!`);
    }
  };

  const deletePattern = (patternName) => {
    if (window.confirm(`Are you sure you want to delete pattern "${patternName}"?`)) {
      const newSavedPatterns = { ...savedPatterns };
      delete newSavedPatterns[patternName];
      setSavedPatternsState(newSavedPatterns);
      setSavedPatterns(newSavedPatterns);
      if (currentPatternName === patternName) {
        loadPattern('Empty', predefinedPatterns['Empty']);
      }
      alert(`Pattern "${patternName}" deleted!`);
    }
  };


  const [activePad, setActivePad] = useState(null);
  const [isLooping, setIsLooping] = useState(true);

  useEffect(() => {
    Tone.Transport.loop = isLooping;
  }, [isLooping]);

  const toggleLoop = () => {
    setIsLooping(prev => !prev);
  };

  useEffect(() => {
    if (masterVol.current) {
      masterVol.current.volume.value = masterVolume;
    }
  }, [masterVolume]);

  useEffect(() => {
    Object.entries(drumVolumes).forEach(([name, volume]) => {
      if (drumVols.current[name]) {
        drumVols.current[name].volume.value = volume;
      }
    });
  }, [drumVolumes]);

  useEffect(() => {
    if (filter.current) {
      filter.current.frequency.value = filterFreq;
    }
  }, [filterFreq]);

  useEffect(() => {
    if (filter.current) {
      filter.current.Q.value = filterQ;
    }
  }, [filterQ]);

  useEffect(() => {
    const refs = [loop1, loop2, loop3, loop4, loop5, loop6];
    refs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.mute = !loopPlaying[i];
      }
    });
  }, [loopPlaying]);

  useEffect(() => {
    const synthRefs = [loop1Synth, loop2Synth, loop3Synth, loop4Synth, loop5Synth, loop6Synth];
    synthRefs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.volume.value = loopVolume[i];
      }
    });
  }, [loopVolume]);

  const toggleLoopAt = (index) => {
    setLoopPlaying(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleLoopVolumeChangeAt = (index, e) => {
    const val = parseFloat(e.target.value);
    setLoopVolume(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleFilterFreqChange = (e) => {
    setFilterFreq(parseFloat(e.target.value));
  };

  const handleFilterQChange = (e) => {
    setFilterQ(parseFloat(e.target.value));
  };

  const handleDrumVolumeChange = (soundName, value) => {
    setDrumVolumes(prevVolumes => ({
      ...prevVolumes,
      [soundName]: parseFloat(value),
    }));
  };

  const handleMasterVolumeChange = (e) => {
    setMasterVolume(parseFloat(e.target.value));
  };


  const getSharablePatternUrl = () => {
    const patternData = {
      pattern,
      bpm,
      stepCount,
      drumVolumes,
      masterVolume,
      filterFreq,
      filterQ,
      loop1Playing: !!loopPlaying[0],
      loop1Volume: loopVolume[0],
      loop2Playing: !!loopPlaying[1],
      loop2Volume: loopVolume[1],
      loop3Playing: !!loopPlaying[2],
      loop3Volume: loopVolume[2],
      loop4Playing: !!loopPlaying[3],
      loop4Volume: loopVolume[3],
      loop5Playing: !!loopPlaying[4],
      loop5Volume: loopVolume[4],
      loop6Playing: !!loopPlaying[5],
      loop6Volume: loopVolume[5],
    };
    const encodedPattern = encodePattern(patternData);
    return `${window.location.origin}?pattern=${encodedPattern}`;
  };

  const playSound = (soundName) => {

    const sound = drumSounds.find(s => s.name === soundName);
    if (sound) {
      const duration = '8n';
      const targetSynth = synths.current[sound.name];
      if (!targetSynth) {
        return;
      }

      if (sound.type === 'membrane') {
        targetSynth.triggerAttackRelease(sound.note, duration);
      } else if (sound.type === 'noise') {
        targetSynth.triggerAttackRelease(duration);
      }
      setActivePad(soundName);
      setTimeout(() => setActivePad(null), 100); // Visual feedback duration
    }
  };

  return {
    pattern,
    bpm,
    stepCount,
    isPlaying,
    currentStep,
    currentPatternName,
    savedPatterns,
    drumVolumes,
    masterVolume,
    loopPlaying,
    loopVolume,
    filterFreq,
    filterQ,
    activePad,
    isLooping,
    toggleStep,
    handlePlay,
    handleStop,
    handleBpmChange,
    handleStepCountChange,
    loadPattern,
    savePattern,
    deletePattern,
    toggleLoop,
    handleDrumVolumeChange,
    handleMasterVolumeChange,
    handleFilterFreqChange,
    handleFilterQChange,
    toggleLoopAt,
    handleLoopVolumeChangeAt,
    playSound,
    predefinedPatterns: getPredefinedPatterns(drumSounds, stepCount),
    analyser: analyserRef.current,
    getSharablePatternUrl,
  };
};