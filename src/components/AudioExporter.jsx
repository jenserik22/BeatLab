import React, { useState, useCallback } from 'react';
import * as Tone from 'tone';

const AudioExporter = ({ drumSounds, bpm, stepCount, pattern, drumVolumes, 
                          masterVolume, filterFreq, filterQ, loopPlaying, loopVolume,
                          loop1, loop2, loop3, loop4, loop5, loop6 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('wav');
  const [durationMode, setDurationMode] = useState('rounds'); // 'rounds' or 'seconds'
  const [durationValue, setDurationValue] = useState('4');
  const [fileName, setFileName] = useState('beatlab-pattern');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState(null);

  const durationOptions = {
    rounds: [
      { value: '1', label: '1 round' },
      { value: '2', label: '2 rounds' },
      { value: '4', label: '4 rounds' },
      { value: '8', label: '8 rounds' },
      { value: '16', label: '16 rounds' },
    ],
    seconds: [
      { value: '10', label: '10 seconds' },
      { value: '30', label: '30 seconds' },
      { value: '60', label: '1 minute' },
      { value: '120', label: '2 minutes' },
      { value: '180', label: '3 minutes' },
    ],
  };

  const encodeWAV = (audioBuffer) => {
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

    setUint32(0x46464952);
    setUint32(36 + length);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numberOfChannels);
    setUint32(sampleRate);
    setUint32(sampleRate * numberOfChannels * 2);
    setUint16(numberOfChannels * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length);

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (offset < audioBuffer.length && pos < view.byteLength) {
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

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const calculateDurationInSeconds = useCallback(() => {
    const patternLengthInSeconds = (stepCount * 60) / (bpm * 4);

    if (durationMode === 'rounds') {
      const rounds = parseInt(durationValue, 10);
      return patternLengthInSeconds * rounds;
    } else {
      return parseInt(durationValue, 10);
    }
  }, [bpm, stepCount, durationMode, durationValue]);

  const renderAudioOffline = useCallback(async () => {
    const duration = calculateDurationInSeconds();
    
    const patternLengthInSeconds = (stepCount / 4) * (60 / bpm);
    const targetRounds = Math.ceil(duration / patternLengthInSeconds);
    const sixteenthNoteDuration = 60 / (bpm * 4);

    return await Tone.Offline(({ transport }) => {
      const masterVolNode = new Tone.Volume(masterVolume || -10);
      masterVolNode.toDestination();
      
      const filterNode = new Tone.Filter(filterFreq || 15000, 'lowpass').connect(masterVolNode);
      filterNode.Q.value = filterQ || 1;

      const synths = {};
      drumSounds.forEach(sound => {
        const volNode = new Tone.Volume(drumVolumes[sound.name] || -10).connect(filterNode);
        
        if (sound.type === 'membrane') {
          synths[sound.name] = new Tone.MembraneSynth({
            envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.1 }
          }).connect(volNode);
        } else {
          synths[sound.name] = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 },
          }).connect(volNode);
        }
      });

      for (let round = 0; round < targetRounds; round++) {
        drumSounds.forEach((sound) => {
          const soundPattern = pattern[sound.name];
          if (soundPattern && Array.isArray(soundPattern)) {
            soundPattern.forEach((isActive, stepIndex) => {
              if (isActive) {
                const stepTime = round * patternLengthInSeconds + stepIndex * sixteenthNoteDuration;
                
                if (sound.type === 'membrane') {
                  synths[sound.name].triggerAttackRelease(sound.note, '8n', stepTime);
                } else {
                  synths[sound.name].triggerAttackRelease('8n', stepTime);
                }
              }
            });
          }
        });
      }

      transport.bpm.value = bpm;
      transport.schedule((time) => {
        const progress = (time / duration) * 100;
        setExportProgress(Math.min(progress, 99));
      }, [duration]);

      transport.start(0).stop(duration);
    }, duration);
  }, [calculateDurationInSeconds, drumSounds, pattern, drumVolumes, masterVolume, filterFreq, filterQ, stepCount, bpm]);

  // Store the original complex version for later
  const renderAudioOfflineComplex = useCallback(async () => {
    const duration = calculateDurationInSeconds();
    
    console.log('[EXPORT CRITICAL] Using COMPLEX render with proper audio graph');
    
    // CRITICAL FIX: Proper timing calculation
    // Each step is a 16th note = 1/4 of a beat
    // Pattern length = (stepCount / 4) * (60 / bpm)
    const patternLengthInSeconds = (stepCount / 4) * (60 / bpm);
    const targetRounds = Math.ceil(duration / patternLengthInSeconds);
    
    // Each 16th note duration = 60 / (bpm * 4)
    const sixteenthNoteDuration = 60 / (bpm * 4);
    
    console.log('[EXPORT CRITICAL] Complex render settings:', {
      bpm,
      stepCount,
      duration,
      patternLengthInSeconds,
      targetRounds,
      sixteenthNoteDuration,
    });

    return await Tone.Offline(({ transport }) => {
      console.log('[EXPORT CRITICAL] Inside COMPLEX Tone.Offline callback');
      
      // TEST: First, test if basic synth-to-destination works
      const testSynth = new Tone.Synth().toDestination();
      testSynth.triggerAttackRelease('C5', '4n', 0.5);
      console.log('[EXPORT AUDIO TEST] Test C5 scheduled');

      // Create PROPER audio graph for drums
      const masterVolNode = new Tone.Volume(masterVolume || -10);
      masterVolNode.toDestination();
      
      const filterNode = new Tone.Filter(filterFreq || 15000, 'lowpass').connect(masterVolNode);
      filterNode.Q.value = filterQ || 1;

      // Create all synths
      const synths = {};
      drumSounds.forEach(sound => {
        const volValue = drumVolumes[sound.name] || -10;
        const volNode = new Tone.Volume(volValue).connect(filterNode);
        
        if (sound.type === 'membrane') {
          synths[sound.name] = new Tone.MembraneSynth({
            envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.1 }
          }).connect(volNode);
        } else {
          synths[sound.name] = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 },
          }).connect(volNode);
        }
      });

      // Add loops if enabled
      let loopCount = 0;
      if (loopPlaying && loopPlaying.length > 0) {
        const loops = [loop1, loop2, loop3, loop4, loop5, loop6];
        const loopSynths = [
          new Tone.FMSynth().connect(masterVolNode),
          new Tone.PolySynth(Tone.Synth).connect(masterVolNode),
          new Tone.MonoSynth().connect(masterVolNode),
          new Tone.PolySynth(Tone.FMSynth).connect(masterVolNode),
          new Tone.PluckSynth().connect(masterVolNode),
          new Tone.NoiseSynth().connect(masterVolNode),
        ];
        
        loopPlaying.forEach((isEnabled, index) => {
          if (isEnabled && loops[index]) {
            const loopPart = new Tone.Part((time, value) => {
              // Loop triggering logic would go here
              if (index === 0 && value.note) {
                loopSynths[0].triggerAttackRelease(value.note, value.duration, time);
              }
            }, []);
            
            loopPart.start(0);
            loopPart.loop = true;
            loopCount++;
          }
        });
      }
      
      console.log('[EXPORT DEBUG] Loops enabled:', loopCount);

      console.log('[EXPORT CRITICAL] Pattern keys:', Object.keys(pattern));
      console.log('[EXPORT CRITICAL] DrumSounds:', drumSounds.map(s => s.name));

      // Schedule all notes with corrected timing
      let noteCount = 0;
      for (let round = 0; round < targetRounds; round++) {
        drumSounds.forEach((sound) => {
          const soundPattern = pattern[sound.name];
          if (soundPattern && Array.isArray(soundPattern)) {
            soundPattern.forEach((isActive, stepIndex) => {
              if (isActive) {
                const stepTime = round * patternLengthInSeconds + stepIndex * sixteenthNoteDuration;
                
                // DEBUG each note
                if (noteCount < 5) { // Log first 5 notes
                  console.log(`[EXPORT NOTE] ${sound.name} at ${stepTime.toFixed(3)}s`);
                }
                
                if (sound.type === 'membrane') {
                  synths[sound.name].triggerAttackRelease(sound.note, '8n', stepTime);
                } else {
                  synths[sound.name].triggerAttackRelease('8n', stepTime);
                }
                noteCount++;
              }
            });
          }
        });
      }
      
      console.log('[EXPORT CRITICAL] Scheduled', noteCount, 'notes for export');

      transport.bpm.value = bpm;
      transport.schedule((time) => {
        const progress = (time / duration) * 100;
        setExportProgress(Math.min(progress, 99));
      }, [duration]);

      console.log('[EXPORT CRITICAL] Starting transport, duration:', duration, 'seconds');
      transport.start(0).stop(duration);
    }, duration);
  }, [calculateDurationInSeconds, drumSounds, pattern, drumVolumes, masterVolume, filterFreq, filterQ, loopPlaying, loop1, loop2, loop3, loop4, loop5, loop6]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      const renderedBuffer = await renderAudioOffline();
      
      if (!renderedBuffer) {
        setError('Failed to render audio: buffer is empty');
        setIsExporting(false);
        return;
      }
      
      const wavBlob = encodeWAV(renderedBuffer);
      downloadBlob(wavBlob, `${fileName}.wav`);
      
      setExportProgress(100);

      setTimeout(() => {
        setIsModalOpen(false);
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
      setIsExporting(false);
    }
  }, [exportFormat, fileName, renderAudioOffline]);

  const handleDurationValueChange = (e) => {
    setDurationValue(e.target.value);
  };

  const resetForm = () => {
    setFileName(`beatab-pattern-${Date.now()}`);
  };

  return (
    <>
      <button
        className="export-button"
        onClick={() => {
          setIsModalOpen(true);
          resetForm();
        }}
        disabled={isExporting}
      >
        Export
      </button>

      {isModalOpen && (
        <div className="export-modal-overlay">
          <div className="export-modal">
            <h3>Export Pattern to Audio</h3>
            
            <div className="export-option">
              <label>Format:</label>
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
              </select>
            </div>

            <div className="export-option">
              <label>Duration Mode:</label>
              <select value={durationMode} onChange={(e) => setDurationMode(e.target.value)}>
                <option value="rounds">Pattern Rounds</option>
                <option value="seconds">Approximate Seconds</option>
              </select>
            </div>

            <div className="export-option">
              <label>Duration:</label>
              <div className="number-input-group">
                <button 
                  className="increment-btn"
                  onClick={() => setDurationValue(Math.max(1, parseInt(durationValue) - 1).toString())}
                  disabled={isExporting}
                >-</button>
                <input
                  type="number"
                  className="number-input"
                  value={durationValue}
                  onChange={handleDurationValueChange}
                  min="1"
                  disabled={isExporting}
                />
                <button 
                  className="increment-btn"
                  onClick={() => setDurationValue((parseInt(durationValue) + 1).toString())}
                  disabled={isExporting}
                >+</button>
                <span className="duration-unit">{durationMode === 'rounds' ? 'rounds' : 'seconds'}</span>
              </div>
            </div>

            <div className="export-option">
              <label>File Name:</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="beatlab-pattern"
              />
            </div>

            {isExporting && (
              <div className="export-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exportProgress}%` }} />
                </div>
                <p>Rendering audio... {Math.round(exportProgress)}%</p>
              </div>
            )}

            {error && <div className="export-error">{error}</div>}

            <div className="export-modal-buttons">
              <button onClick={handleExport} disabled={isExporting || !fileName.trim()}>
                {isExporting ? 'Exporting...' : 'Confirm Export'}
              </button>
              <button onClick={() => setIsModalOpen(false)} disabled={isExporting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AudioExporter;
