import React, { useState, useCallback } from 'react';
import * as Tone from 'tone';
import { LOOP_CONFIGS } from '../constants/loopConfigs';

const AudioExporter = ({ drumSounds, bpm, stepCount, pattern, drumVolumes, 
                          masterVolume, filterFreq, filterQ, loopPlaying, loopVolume, userLoops }) => {

  // Prepare active loop configurations for export
  const activeLoopConfigs = React.useMemo(() => {
    return LOOP_CONFIGS
      .map((config, index) => ({
        config,
        enabled: loopPlaying[index],
        volume: loopVolume[index]
      }))
      .filter(loop => loop.enabled);
  }, [loopPlaying, loopVolume]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('wav');
  const [durationMode, setDurationMode] = useState('rounds'); // 'rounds' or 'seconds'
  const [durationValue, setDurationValue] = useState('4');
  const [fileName, setFileName] = useState('beatlab-pattern');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState(null);

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

    // Pre-load all user loop buffers before rendering
    const loadedUserLoops = [];
    if (userLoops && Array.isArray(userLoops)) {
      for (const loop of userLoops) {
        if (loop && loop.playing && loop.url) {
          try {
            // Load the audio buffer
            const buffer = await Tone.Buffer.fromUrl(loop.url);
            loadedUserLoops.push({
              buffer: buffer.get(),
              volume: loop.volume || -10,
              id: loop.id
            });
          } catch (error) {
            console.warn(`Failed to load user loop ${loop.id}:`, error);
            // Continue without this loop
          }
        }
      }
    }

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

      // Recreate and add predefined loops (they're generated by synths, not audio files)
      activeLoopConfigs.forEach(({ config, volume }) => {
        try {
          const { synthConfig, effects, pattern } = config;
          
          // Create synth
          let synth;
          switch (synthConfig.type) {
            case 'FMSynth':
              synth = new Tone.FMSynth(synthConfig.options);
              break;
            case 'MonoSynth':
              synth = new Tone.MonoSynth(synthConfig.options);
              break;
            case 'PolySynth':
              if (synthConfig.synthType) {
                synth = new Tone.PolySynth(Tone[synthConfig.synthType], synthConfig.options);
              } else {
                synth = new Tone.PolySynth(synthConfig.options);
              }
              break;
            case 'NoiseSynth':
              synth = new Tone.NoiseSynth(synthConfig.options);
              break;
            case 'PluckSynth':
              synth = new Tone.PluckSynth(synthConfig.options);
              break;
            default:
              synth = new Tone.Synth(synthConfig.options);
          }
          
          // Create effects chain if present
          let lastNode = synth;
          if (effects && effects.length > 0) {
            effects.forEach(effectConfig => {
              let effectNode;
              switch (effectConfig.type) {
                case 'Chorus':
                  effectNode = new Tone.Chorus(...effectConfig.options);
                  effectNode.start();
                  break;
                case 'FeedbackDelay':
                  effectNode = new Tone.FeedbackDelay(...effectConfig.options);
                  break;
                case 'Filter':
                  effectNode = new Tone.Filter(...effectConfig.options);
                  break;
                case 'Distortion':
                  effectNode = new Tone.Distortion(...effectConfig.options);
                  break;
                case 'Reverb':
                  effectNode = new Tone.Reverb(...effectConfig.options);
                  break;
                default:
                  return;
              }
              
              lastNode.connect(effectNode);
              lastNode = effectNode;
            });
          }
          
          // Connect to filter node and set volume
          lastNode.connect(filterNode);
          synth.volume.value = volume;
          
          // Create and start pattern
          let loopPart;
          if (pattern.type === 'note') {
            loopPart = new Tone.Part((time, value) => {
              synth.triggerAttackRelease(value.note, value.duration, time);
            }, pattern.data).start(0);
          } else if (pattern.type === 'chord') {
            loopPart = new Tone.Part((time, value) => {
              synth.triggerAttackRelease(value.notes, "2n", time);
            }, pattern.data).start(0);
          } else if (pattern.type === 'noise') {
            loopPart = new Tone.Part((time) => {
              synth.triggerAttackRelease("16n", time);
            }, pattern.data).start(0);
          }
          
          if (loopPart) {
            loopPart.loop = true;
            loopPart.loopEnd = pattern.loopEnd || "2m";
          }
        } catch (error) {
          console.warn(`Error creating loop ${config.id}:`, error);
        }
      });

      // Add user-uploaded loops (using pre-loaded buffers)
      loadedUserLoops.forEach(({ buffer, volume }) => {
        try {
          // Create player with pre-loaded buffer
          const loopPlayer = new Tone.Player({
            url: buffer,  // Use the pre-loaded buffer
            loop: true,
            autostart: false
          }).connect(filterNode);
          
          // Set volume
          loopPlayer.volume.value = volume;
          
          // Start immediately and loop for duration
          transport.scheduleOnce(() => loopPlayer.start(0), 0);
        } catch (error) {
          console.warn(`Error creating user loop:`, error);
        }
      })

      transport.bpm.value = bpm;
      transport.schedule((time) => {
        const progress = (time / duration) * 100;
        setExportProgress(Math.min(progress, 99));
      }, [duration]);

      transport.start(0).stop(duration);
    }, duration);
  }, [calculateDurationInSeconds, drumSounds, pattern, drumVolumes, masterVolume, filterFreq, filterQ, stepCount, bpm, activeLoopConfigs, userLoops]);

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
  }, [fileName, renderAudioOffline]);

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
