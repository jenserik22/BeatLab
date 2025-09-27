import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

export const useDrumMachine = (drumSounds) => {
  const createEmptyPattern = () => {
    const emptyPattern = {};
    drumSounds.forEach(sound => {
      emptyPattern[sound.name] = Array(16).fill(false);
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

  const [pattern, setPattern] = useState(() => {
    const savedPattern = localStorage.getItem('currentBeatLabPattern');
    if (savedPattern) {
      return JSON.parse(savedPattern);
    }
    return predefinedPatterns['Empty'];
  });

  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [currentPatternName, setCurrentPatternName] = useState('Empty');
  const [savedPatterns, setSavedPatterns] = useState(() => {
    const saved = localStorage.getItem('beatLabSavedPatterns');
    return saved ? JSON.parse(saved) : {};
  });

  // Refs for Tone.js instruments
  const synths = useRef({});
  const sequenceRef = useRef(null); // Ref to store the Tone.Sequence instance

  // Use a ref to store the latest pattern state for the Tone.Sequence callback
  const patternRef = useRef(pattern);
  useEffect(() => {
    patternRef.current = pattern;
    localStorage.setItem('currentBeatLabPattern', JSON.stringify(pattern));
  }, [pattern]);

  const [drumVolumes, setDrumVolumes] = useState(() => {
    const initialVolumes = {};
    drumSounds.forEach(sound => {
      initialVolumes[sound.name] = -10;
    });
    return initialVolumes;
  });

  const [masterVolume, setMasterVolume] = useState(-10);
  const [loop1Playing, setLoop1Playing] = useState(false);
  const [loop1Volume, setLoop1Volume] = useState(-10);
  const loop1Synth = useRef(null);
  const loop1 = useRef(null);

  const [loop2Playing, setLoop2Playing] = useState(false);
  const [loop2Volume, setLoop2Volume] = useState(-10);
  const loop2Synth = useRef(null);
  const loop2 = useRef(null);

  const [loop3Playing, setLoop3Playing] = useState(false);
  const [loop3Volume, setLoop3Volume] = useState(-10);
  const loop3Synth = useRef(null);
  const loop3 = useRef(null);

  const [loop4Playing, setLoop4Playing] = useState(false);
  const [loop4Volume, setLoop4Volume] = useState(-10);
  const loop4Synth = useRef(null);
  const loop4 = useRef(null);

  const [loop5Playing, setLoop5Playing] = useState(false);
  const [loop5Volume, setLoop5Volume] = useState(-10);
  const loop5Synth = useRef(null);
  const loop5 = useRef(null);

  const [loop6Playing, setLoop6Playing] = useState(false);
  const [loop6Volume, setLoop6Volume] = useState(-10);
  const loop6Synth = useRef(null);
  const loop6 = useRef(null);

  const loopRefs = [loop1, loop2, loop3, loop4, loop5, loop6];

  const [filterFreq, setFilterFreq] = useState(20000);
  const [filterQ, setFilterQ] = useState(1);

  const masterVol = useRef(null);
  const drumVols = useRef({});
  const filter = useRef(null);
  const analyserRef = useRef(null);

  // Initialize Tone.js instruments once
  useEffect(() => {
    console.log('Initializing Tone.js instruments...');

    masterVol.current = new Tone.Volume(-10).toDestination();
    filter.current = new Tone.Filter(filterFreq, 'lowpass').connect(masterVol.current);
    analyserRef.current = new Tone.Analyser('fft', 256);
    masterVol.current.connect(analyserRef.current);

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
    console.log('Tone.js instruments initialized.');

    const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(masterVol.current).start();
    const delay = new Tone.FeedbackDelay("8n", 0.5).connect(chorus);
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

    const technoFilter = new Tone.Filter(1200, "lowpass").connect(masterVol.current);
    const technoDistortion = new Tone.Distortion(0.4).connect(technoFilter);
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

    const padFilter = new Tone.Filter(200, "lowpass").connect(masterVol.current);
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

    const pluckReverb = new Tone.Reverb(5).connect(masterVol.current);
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

    const bitCrusher = new Tone.BitCrusher(4).connect(masterVol.current);
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
      loop6Synth.current.triggerAttack(time);
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
              synths.current[sound.name].triggerAttack(time);
            }
          }
        });
      },
      Array.from({ length: 16 }, (_, i) => i),
      '16n'
    ).start(0);
    console.log('Tone.Sequence set up.');

    // Set loop points for the transport
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = '4m'; // Loop every 4 measures (16 steps at 16n)

    return () => {
      console.log('Disposing Tone.js instruments and sequence...');
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      loopRefs.forEach(loopRef => {
        if (loopRef.current) {
          loopRef.current.dispose();
        }
      });
      Object.values(synths.current).forEach(synth => synth.dispose());
      console.log('Disposal complete.');
    };
  }, []); // Empty dependency array: runs once on mount

  // Update BPM when bpm state changes
  useEffect(() => {
    console.log('BPM changed to:', bpm);
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
    console.log('Play button clicked. Transport state:', Tone.Transport.state);
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
      loopRefs.forEach(loopRef => {
        if (loopRef.current) {
          loopRef.current.start(0);
        }
      });
      setIsPlaying(true);
      console.log('Transport started.');
    }
  };

  const handleStop = useCallback(() => {
    console.log('Stop button clicked. Transport state:', Tone.Transport.state);
    Tone.Transport.stop();
    loopRefs.forEach(loopRef => {
      if (loopRef.current) {
        loopRef.current.stop(0);
      }
    });
    setIsPlaying(false);
    setCurrentStep(-1); // Reset playhead
    console.log('Transport stopped.');
  }, []);

  const handleBpmChange = (e) => {
    const newBpm = parseFloat(e.target.value);
    setBpm(newBpm);
  };

  const loadPattern = useCallback((patternName, patternData) => {
    if (patternData.pattern) { // Check for new format
      setPattern(patternData.pattern);
      setDrumVolumes(patternData.drumVolumes);
      setMasterVolume(patternData.masterVolume);
      setFilterFreq(patternData.filterFreq);
      setFilterQ(patternData.filterQ);
      setLoop1Playing(patternData.loop1Playing);
      setLoop1Volume(patternData.loop1Volume);
      setLoop2Playing(patternData.loop2Playing);
      setLoop2Volume(patternData.loop2Volume);
      setLoop3Playing(patternData.loop3Playing);
      setLoop3Volume(patternData.loop3Volume);
      setLoop4Playing(patternData.loop4Playing);
      setLoop4Volume(patternData.loop4Volume);
      setLoop5Playing(patternData.loop5Playing);
      setLoop5Volume(patternData.loop5Volume);
      setLoop6Playing(patternData.loop6Playing);
      setLoop6Volume(patternData.loop6Volume);
    } else { // For backward compatibility
      setPattern(patternData);
    }
    setCurrentPatternName(patternName);
    handleStop(); // Stop playback when changing pattern
  }, [handleStop]);

  const savePattern = () => {
    const patternName = prompt('Enter a name for your pattern:');
    if (patternName) {
      const patternData = {
        pattern,
        drumVolumes,
        masterVolume,
        filterFreq,
        filterQ,
        loop1Playing,
        loop1Volume,
        loop2Playing,
        loop2Volume,
        loop3Playing,
        loop3Volume,
        loop4Playing,
        loop4Volume,
        loop5Playing,
        loop5Volume,
        loop6Playing,
        loop6Volume,
      };
      const newSavedPatterns = { ...savedPatterns, [patternName]: patternData };
      setSavedPatterns(newSavedPatterns);
      localStorage.setItem('beatLabSavedPatterns', JSON.stringify(newSavedPatterns));
      setCurrentPatternName(patternName);
      alert(`Pattern "${patternName}" saved!`);
    }
  };

  const deletePattern = (patternName) => {
    if (window.confirm(`Are you sure you want to delete pattern "${patternName}"?`)) {
      const newSavedPatterns = { ...savedPatterns };
      delete newSavedPatterns[patternName];
      setSavedPatterns(newSavedPatterns);
      localStorage.setItem('beatLabSavedPatterns', JSON.stringify(newSavedPatterns));
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
    if (loop1.current) {
      loop1.current.mute = !loop1Playing;
    }
  }, [loop1Playing]);

  useEffect(() => {
    if (loop1Synth.current) {
      loop1Synth.current.volume.value = loop1Volume;
    }
  }, [loop1Volume]);

  useEffect(() => {
    if (loop2.current) {
      loop2.current.mute = !loop2Playing;
    }
  }, [loop2Playing]);

  useEffect(() => {
    if (loop2Synth.current) {
      loop2Synth.current.volume.value = loop2Volume;
    }
  }, [loop2Volume]);

  useEffect(() => {
    if (loop3.current) {
      loop3.current.mute = !loop3Playing;
    }
  }, [loop3Playing]);

  useEffect(() => {
    if (loop3Synth.current) {
      loop3Synth.current.volume.value = loop3Volume;
    }
  }, [loop3Volume]);

  useEffect(() => {
    if (loop4.current) {
      loop4.current.mute = !loop4Playing;
    }
  }, [loop4Playing]);

  useEffect(() => {
    if (loop4Synth.current) {
      loop4Synth.current.volume.value = loop4Volume;
    }
  }, [loop4Volume]);

  useEffect(() => {
    if (loop5.current) {
      loop5.current.mute = !loop5Playing;
    }
  }, [loop5Playing]);

  useEffect(() => {
    if (loop5Synth.current) {
      loop5Synth.current.volume.value = loop5Volume;
    }
  }, [loop5Volume]);

  useEffect(() => {
    if (loop6.current) {
      loop6.current.mute = !loop6Playing;
    }
  }, [loop6Playing]);

  useEffect(() => {
    if (loop6Synth.current) {
      loop6Synth.current.volume.value = loop6Volume;
    }
  }, [loop6Volume]);

  const toggleLoop1 = () => {
    setLoop1Playing(prev => !prev);
  };

  const handleLoop1VolumeChange = (e) => {
    setLoop1Volume(parseFloat(e.target.value));
  };

  const toggleLoop2 = () => {
    setLoop2Playing(prev => !prev);
  };

  const handleLoop2VolumeChange = (e) => {
    setLoop2Volume(parseFloat(e.target.value));
  };

  const toggleLoop3 = () => {
    setLoop3Playing(prev => !prev);
  };

  const handleLoop3VolumeChange = (e) => {
    setLoop3Volume(parseFloat(e.target.value));
  };

  const toggleLoop4 = () => {
    setLoop4Playing(prev => !prev);
  };

  const handleLoop4VolumeChange = (e) => {
    setLoop4Volume(parseFloat(e.target.value));
  };

  const toggleLoop5 = () => {
    setLoop5Playing(prev => !prev);
  };

  const handleLoop5VolumeChange = (e) => {
    setLoop5Volume(parseFloat(e.target.value));
  };

  const toggleLoop6 = () => {
    setLoop6Playing(prev => !prev);
  };

  const handleLoop6VolumeChange = (e) => {
    setLoop6Volume(parseFloat(e.target.value));
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

  const playSound = (soundName) => {
    const sound = drumSounds.find(s => s.name === soundName);
    if (sound) {
      if (sound.type === 'membrane') {
        synths.current[sound.name].triggerAttackRelease(sound.note, '8n');
      } else if (sound.type === 'noise') {

        synths.current[sound.name].triggerAttack();
      }
      setActivePad(soundName);
      setTimeout(() => setActivePad(null), 100); // Visual feedback duration
    }
  };

  return {
    pattern,
    bpm,
    isPlaying,
    currentStep,
    currentPatternName,
    savedPatterns,
    drumVolumes,
    masterVolume,
    loop1Playing,
    loop1Volume,
    loop2Playing,
    loop2Volume,
    loop3Playing,
    loop3Volume,
    loop4Playing,
    loop4Volume,
    loop5Playing,
    loop5Volume,
    loop6Playing,
    loop6Volume,
    filterFreq,
    filterQ,
    activePad,
    isLooping,
    toggleStep,
    handlePlay,
    handleStop,
    handleBpmChange,
    loadPattern,
    savePattern,
    deletePattern,
    toggleLoop,
    handleDrumVolumeChange,
    handleMasterVolumeChange,
    handleFilterFreqChange,
    handleFilterQChange,
    toggleLoop1,
    handleLoop1VolumeChange,
    toggleLoop2,
    handleLoop2VolumeChange,
    toggleLoop3,
    handleLoop3VolumeChange,
    toggleLoop4,
    handleLoop4VolumeChange,
    toggleLoop5,
    handleLoop5VolumeChange,
    toggleLoop6,
    handleLoop6VolumeChange,
    playSound,
    predefinedPatterns,
    analyser: analyserRef.current,
  };
};