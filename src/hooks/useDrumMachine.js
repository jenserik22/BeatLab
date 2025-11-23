import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  getCurrentPattern,
  setCurrentPattern,
  getSavedPatterns,
  setSavedPatterns,
} from '../utils/storage';
import { DEFAULTS, LOOPS_CONFIG, USER_LOOP_CONFIG } from '../constants/config';
import {
  generateAllPatterns,
} from '../utils/patternFactory';
import { getStepCount, setStepCount } from '../utils/storage';
import { encodePatternPayload } from '../utils/url';
import { savePattern as savePatternToRemote } from '../services/shareStore';
import {
  buildPatternData,
  adaptPatternToStepCount as adaptPattern,
} from '../utils/patternBuilder';
import { createBuiltinLoops, createUserLoop } from '../utils/loopFactory';
import { createKitSynths, disposeKitSynths, getVelocityForStep } from '../utils/kitFactory';
import { getDefaultKit } from '../constants/kitsConfig';

const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`);

const resolveBaseShareUrl = () => {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  const publicUrl = process.env.PUBLIC_URL;

  if (publicUrl) {
    try {
      const url = new URL(publicUrl, origin);
      return ensureTrailingSlash(`${url.origin}${url.pathname}`);
    } catch (_e) {
      const sanitized = publicUrl.replace(/\/+$/g, '').replace(/^\/+/, '');
      if (!sanitized) {
        return ensureTrailingSlash(origin);
      }
      return ensureTrailingSlash(`${origin}/${sanitized}`);
    }
  }

  if (origin.includes('github.io') || pathname.toLowerCase().includes('/beatlab')) {
    return ensureTrailingSlash(`${origin}/BeatLab`);
  }

  return ensureTrailingSlash(origin);
};

export const useDrumMachine = (drumSounds) => {
  const [stepCount, setStepCountState] = useState(getStepCount(DEFAULTS.STEP_COUNT));

  const predefinedPatterns = generateAllPatterns(drumSounds, getStepCount(DEFAULTS.STEP_COUNT));

  const [pattern, setPattern] = useState(() => getCurrentPattern(drumSounds, stepCount));

  const [bpm, setBpm] = useState(DEFAULTS.BPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [currentPatternName, setCurrentPatternName] = useState('Empty');
  const [savedPatterns, setSavedPatternsState] = useState(() => getSavedPatterns(drumSounds));
  const [currentKit, setCurrentKit] = useState(getDefaultKit());
  const [swing, setSwing] = useState(0);
  
  // User uploaded loops - dynamic array
  const [userLoops, setUserLoops] = useState([]);

  // Refs for Tone.js instruments
  const synths = useRef({});
  const sequenceRef = useRef(null); // Ref to store the Tone.Sequence instance
  const effectNodesRef = useRef([]);
  const kitDataRef = useRef(null); // Stores { synths, drumVolumes, velocityShapes, effectNodes }
  const isInitialMount = useRef(true);

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
  
  const loopSynths = useRef([]);
  const loops = useRef([]);
  
  // User loop refs - stored in maps for dynamic access
  const userLoopPlayers = useRef({});
  const userLoopControls = useRef({});

  const [filterFreq, setFilterFreq] = useState(DEFAULTS.FILTER_FREQ);
  const [filterQ, setFilterQ] = useState(DEFAULTS.FILTER_Q);

  const masterVol = useRef(null);
  const drumVols = useRef({});
  const filter = useRef(null);
  const analyserRef = useRef(null);

  const rebuildSequencer = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }
    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        drumSounds.forEach(sound => {
          if (patternRef.current[sound.name][step]) {
            const velocity = getVelocityForStep(kitDataRef.current?.velocityShapes, sound.name, step);
            const targetSynth = synths.current[sound.name];
            if (!targetSynth) return;

            if (sound.type === 'membrane') {
              targetSynth.triggerAttackRelease(sound.note, '8n', time, velocity);
            } else if (sound.type === 'noise') {
              targetSynth.triggerAttackRelease('8n', time, velocity);
            }
          }
        });
      },
      Array.from({ length: stepCount }, (_, i) => i),
      '16n'
    ).start(0);
  }, [drumSounds, stepCount]);

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

    // Create drum synths using kit factory
    const kitData = createKitSynths(currentKit, filter.current, registerEffectNode);
    kitDataRef.current = kitData;
    synths.current = kitData.synths;
    drumVols.current = kitData.drumVolumes;
    
    debugLog('Tone.js instruments initialized.');

    // Create all loops using factory
    const { synthRefs, loopRefs } = createBuiltinLoops(masterVol.current, registerEffectNode);
    loopSynths.current = synthRefs;
    loops.current = loopRefs;

    // Setup Tone.Sequence once
    rebuildSequencer();
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

      loops.current.forEach(loopRef => {
        if (loopRef?.current) {
          loopRef.current.stop(0);
          loopRef.current.dispose();
          loopRef.current = null;
        }
      });

      loopSynths.current.forEach(synthRef => {
        if (synthRef?.current) {
          synthRef.current.dispose();
          synthRef.current = null;
        }
      });

      // Dispose kit synths using factory
      if (kitDataRef.current) {
        disposeKitSynths(kitDataRef.current);
        kitDataRef.current = null;
      }
      synths.current = {};
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

      // Revoke all blob URLs for user loops and cleanup
      Object.values(userLoopPlayers.current).forEach(player => {
        if (player?.current) {
          player.current.dispose();
        }
      });
      Object.values(userLoopControls.current).forEach(control => {
        if (control?.current && typeof control.current.dispose === 'function') {
          control.current.dispose();
        }
      });
      userLoopPlayers.current = {};
      userLoopControls.current = {};
      
      // Revoke blob URLs for all user loops
      userLoops.forEach(loop => {
        if (loop.url) {
          URL.revokeObjectURL(loop.url);
        }
      });

      debugLog('Disposal complete.');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs once on mount

  // Rebuild sequence when stepCount changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      rebuildSequencer();
    }
  }, [rebuildSequencer]);

  // Update BPM when bpm state changes
  useEffect(() => {
    debugLog('BPM changed to:', bpm);
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // Update swing when swing state changes
  useEffect(() => {
    debugLog('Swing changed to:', swing);
    Tone.Transport.swing = swing;
  }, [swing]);

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
      loops.current.forEach(loopRef => {
        if (loopRef?.current) {
          loopRef.current.start(0);
        }
      });
      // Start playing user loops that are enabled
      Object.entries(userLoopControls.current).forEach(([loopId, control]) => {
        const loop = userLoops.find(l => l.id === loopId);
        if (control?.current && loop?.playing) {
          control.current.start(0);
        }
      });
      setIsPlaying(true);
      debugLog('Transport started.');
    }
  };

  const handleStop = useCallback(() => {
    debugLog('Stop button clicked. Transport state:', Tone.Transport.state);
    Tone.Transport.stop();
    loops.current.forEach(loopRef => {
      if (loopRef?.current) {
        loopRef.current.stop(0);
      }
    });
    // Stop all user loops
    Object.values(userLoopControls.current).forEach(control => {
      if (control?.current) {
        control.current.stop(0);
      }
    });
    setIsPlaying(false);
    setCurrentStep(-1); // Reset playhead
    debugLog('Transport stopped.');
  }, []);

  const applyBpm = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    setBpm(numeric);
  };

  const handleBpmChange = (e) => {
    applyBpm(e.target.value);
  };

  const handleStepCountChange = (e) => {
    const next = parseInt(e.target.value, 10);
    if (!Number.isInteger(next) || next <= 0) return;
    handleStop();
    const adapted = adaptPattern(patternRef.current, drumSounds, next);
    setPattern(adapted);
    setStepCountState(next);
    setStepCount(next);
  };

  const loadKit = useCallback((kit) => {
    debugLog('Loading kit:', kit.name);
    handleStop(); // Stop playback when changing kit

    // Dispose old kit
    if (kitDataRef.current) {
      disposeKitSynths(kitDataRef.current);
      kitDataRef.current = null;
    }
    synths.current = {};
    drumVols.current = {};
    effectNodesRef.current = [];

    // Create new kit synths
    const registerEffectNode = (node) => {
      effectNodesRef.current.push(node);
      return node;
    };

    const kitData = createKitSynths(kit, filter.current, registerEffectNode);
    kitDataRef.current = kitData;
    synths.current = kitData.synths;
    drumVols.current = kitData.drumVolumes;

    // Apply kit defaults
    if (kit.defaultBpm) {
      setBpm(kit.defaultBpm);
    }
    if (kit.defaultSwing !== undefined) {
      setSwing(kit.defaultSwing);
    }
    if (kit.defaultFilterFreq !== undefined) {
      setFilterFreq(kit.defaultFilterFreq);
    }
    if (kit.defaultFilterQ !== undefined) {
      setFilterQ(kit.defaultFilterQ);
    }

    // Rebuild sequence with new synths
    rebuildSequencer();

    setCurrentKit(kit);
    debugLog('Kit loaded:', kit.name);
  }, [filter, handleStop, rebuildSequencer]);

  const loadPattern = useCallback((patternName, patternData) => {
    if (patternData.pattern) { // Check for new format
      const newStepCount = patternData.stepCount || stepCount;
      const target = adaptPattern(patternData.pattern, drumSounds, newStepCount);
      setPattern(target);
      if (patternData.bpm) {
        setBpm(patternData.bpm);
      }
      if (patternData.stepCount) {
        setStepCountState(patternData.stepCount);
      }
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
      setPattern(adaptPattern(patternData, drumSounds, stepCount));
    }
    setCurrentPatternName(patternName);
    handleStop(); // Stop playback when changing pattern
  }, [handleStop, drumSounds, stepCount]);

  const savePattern = () => {
    const patternName = prompt('Enter a name for your pattern:');
    if (patternName) {
      const patternData = buildPatternData(pattern, {
        bpm,
        stepCount,
        drumVolumes,
        masterVolume,
        filterFreq,
        filterQ,
        loopPlaying,
        loopVolume,
      }, drumSounds);
      const newSavedPatterns = { ...savedPatterns, [patternName]: patternData };
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
    loops.current.forEach((ref, i) => {
      if (ref?.current) {
        ref.current.mute = !loopPlaying[i];
      }
    });
  }, [loopPlaying]);

  useEffect(() => {
    loopSynths.current.forEach((ref, i) => {
      if (ref?.current) {
        ref.current.volume.value = loopVolume[i];
      }
    });
  }, [loopVolume]);

  // Create/destroy user loop players when loops change
  useEffect(() => {
    // Create players for new loops with URLs
    userLoops.forEach(loop => {
      if (loop.url && !userLoopPlayers.current[loop.id]) {
        // Create the player
        const { playerRef, controlRef } = createUserLoop(loop.url, masterVol.current);
        userLoopPlayers.current[loop.id] = playerRef;
        userLoopControls.current[loop.id] = controlRef;
      } else if (!loop.url && userLoopPlayers.current[loop.id]) {
        // Clean up if URL was removed
        if (userLoopPlayers.current[loop.id]?.current) {
          userLoopPlayers.current[loop.id].current.dispose();
        }
        delete userLoopPlayers.current[loop.id];
        delete userLoopControls.current[loop.id];
      }
    });
    
    // Set volumes for all user loops
    Object.keys(userLoopPlayers.current).forEach(loopId => {
      const loop = userLoops.find(l => l.id === loopId);
      if (loop && userLoopPlayers.current[loopId]?.current) {
        userLoopPlayers.current[loopId].current.volume.value = loop.volume;
      }
    });
  }, [userLoops, masterVol]);

  // Handle user loop mute state
  useEffect(() => {
    Object.entries(userLoopControls.current).forEach(([loopId, control]) => {
      const loop = userLoops.find(l => l.id === loopId);
      if (control?.current) {
        control.current.mute = !loop?.playing;
      }
    });
  }, [userLoops]);

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

  // User loop handlers
  const addUserLoop = () => {
    if (userLoops.length >= USER_LOOP_CONFIG.MAX_USER_LOOPS) {
      alert('Maximum number of user loops reached');
      return;
    }
    
    const newLoop = {
      id: `user_${Date.now()}`,
      url: null,
      playing: false,
      volume: DEFAULTS.VOLUME_DB
    };
    
    setUserLoops(prev => [...prev, newLoop]);
  };

  const handleUserLoopFileUpload = (loopId, file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file.');
      return;
    }
    
    // Validate file size (limit to 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      alert('File size must be less than 20MB.');
      return;
    }
    
    // Find the loop and revoke old URL if exists
    const loopIndex = userLoops.findIndex(l => l.id === loopId);
    if (loopIndex === -1) return;
    
    if (userLoops[loopIndex].url) {
      URL.revokeObjectURL(userLoops[loopIndex].url);
    }
    
    // Create new blob URL
    const blobUrl = URL.createObjectURL(file);
    
    // Update state
    setUserLoops(prev => prev.map(loop => 
      loop.id === loopId ? { ...loop, url: blobUrl } : loop
    ));
  };

  const handleClearUserLoop = (loopId) => {
    // Find the loop
    const loopIndex = userLoops.findIndex(l => l.id === loopId);
    if (loopIndex === -1) return;
    
    // Revoke blob URL if it exists
    if (userLoops[loopIndex].url) {
      URL.revokeObjectURL(userLoops[loopIndex].url);
    }
    
    // Clear the uploaded URL for this loop
    setUserLoops(prev => prev.map(loop => 
      loop.id === loopId ? { ...loop, url: null, playing: false } : loop
    ));
  };

  const toggleUserLoop = (loopId) => {
    setUserLoops(prev => {
      const updatedLoops = prev.map(loop => 
        loop.id === loopId ? { ...loop, playing: !loop.playing } : loop
      );
      
      // Start playing immediately if transport is already running
      const toggledLoop = updatedLoops.find(l => l.id === loopId);
      if (toggledLoop?.playing && Tone.Transport.state === 'started') {
        const control = userLoopControls.current[loopId];
        if (control?.current) {
          control.current.start(0);
        }
      }
      
      return updatedLoops;
    });
  };

  const handleUserLoopVolumeChange = (loopId, value) => {
    setUserLoops(prev => prev.map(loop => 
      loop.id === loopId ? { ...loop, volume: parseFloat(value) } : loop
    ));
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

  const handleSwingChange = (e) => {
    setSwing(parseFloat(e.target.value));
  };


  const buildShareData = () => {
    return buildPatternData(pattern, {
      bpm,
      stepCount,
      drumVolumes,
      masterVolume,
      filterFreq,
      filterQ,
      loopPlaying,
      loopVolume,
    }, drumSounds);
  };

  const getSharablePatternUrl = async () => {
    const shareData = buildShareData();
    const baseUrl = resolveBaseShareUrl();
    const fallbackPayload = encodePatternPayload(shareData);
    const fallbackUrl = `${baseUrl}?p=${fallbackPayload}`;

    try {
      const id = await savePatternToRemote(shareData);
      return {
        url: `${baseUrl}${id}`,
        fallbackUrl,
        fallbackPayload,
        isFallback: false,
      };
    } catch (error) {
      return {
        url: fallbackUrl,
        fallbackUrl,
        fallbackPayload,
        isFallback: true,
        error,
      };
    }
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
    swing,
    currentKit,
    toggleStep,
    handlePlay,
    handleStop,
    handleBpmChange,
    handleStepCountChange,
    handleSwingChange,
    loadPattern,
    loadKit,
    savePattern,
    deletePattern,
    toggleLoop,
    handleDrumVolumeChange,
    handleMasterVolumeChange,
    handleFilterFreqChange,
    handleFilterQChange,
    toggleLoopAt,
    handleLoopVolumeChangeAt,
    addUserLoop,
    handleUserLoopFileUpload,
    handleClearUserLoop,
    toggleUserLoop,
    handleUserLoopVolumeChange,
    playSound,
    predefinedPatterns: generateAllPatterns(drumSounds, stepCount),
    analyser: analyserRef.current,
    getSharablePatternUrl,
    // Export loops for audio export
    loop1: loops.current[0]?.current || null,
    loop2: loops.current[1]?.current || null,
    loop3: loops.current[2]?.current || null,
    loop4: loops.current[3]?.current || null,
    loop5: loops.current[4]?.current || null,
    loop6: loops.current[5]?.current || null,
    // Export user loop state
    userLoops,
  };
};