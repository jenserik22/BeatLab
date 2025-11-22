import React from 'react';
import { LOOPS_CONFIG, DEFAULTS, USER_LOOP_CONFIG } from '../constants/config';
import { dbToPercent, percentToDb } from '../utils/volume';
import LoopControl from './LoopControl';

const Mixer = ({
  drumSounds,
  drumVolumes,
  filterFreq,
  filterQ,
  loopPlaying,
  loopVolume,
  handleDrumVolumeChange,
  handleFilterFreqChange,
  handleFilterQChange,
  toggleLoopAt,
  handleLoopVolumeChangeAt,
  // User loop props
  userLoops,
  addUserLoop,
  handleUserLoopFileUpload,
  handleClearUserLoop,
  toggleUserLoop,
  handleUserLoopVolumeChange,
  swing,
  handleSwingChange,
}) => {
  return (
    <div className="mixer-controls">
      <div className="drum-mix">
        <h3>Drum Mix</h3>
        <div className="mix-controls">
          {drumSounds.map(sound => (
            <div key={sound.name} className="mix-control">
              <label htmlFor={`${sound.name}-volume`}>{sound.name}</label>
              <input
                type="range"
                id={`${sound.name}-volume`}
                min={0}
                max={100}
                step="1"
                value={dbToPercent(drumVolumes[sound.name])}
                onChange={(e) => handleDrumVolumeChange(
                  sound.name,
                  percentToDb(parseFloat(e.target.value), DEFAULTS.VOLUME_MIN, DEFAULTS.VOLUME_MAX)
                )}
              />
              <span>{dbToPercent(drumVolumes[sound.name])}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="filter-controls">
        <h3>Global Filter</h3>
        <div className="mix-controls">
          <div className="mix-control">
            <label htmlFor="filter-freq">Frequency</label>
            <input
              type="range"
              id="filter-freq"
              min="20"
              max="20000"
              step="1"
              value={filterFreq}
              onChange={handleFilterFreqChange}
            />
            <span>{filterFreq} Hz</span>
          </div>
          <div className="mix-control">
            <label htmlFor="filter-q">Resonance</label>
            <input
              type="range"
              id="filter-q"
              min="0.1"
              max="20"
              step="0.1"
              value={filterQ}
              onChange={handleFilterQChange}
            />
            <span>{filterQ}</span>
          </div>
          <div className="mix-control">
            <label htmlFor="swing">Swing</label>
            <input
              type="range"
              id="swing"
              min="0"
              max="0.5"
              step="0.01"
              value={swing}
              onChange={handleSwingChange}
            />
            <span>{Math.round(swing * 100)}%</span>
          </div>
        </div>
      </div>
      
      {/* Predefined loops */}
      <div className="background-loops">
        <h3>Background Loops</h3>
        {LOOPS_CONFIG.map((loop, i) => (
          <LoopControl
            key={loop.id}
            label={loop.label}
            playing={loopPlaying?.[i]}
            volume={loopVolume?.[i] ?? DEFAULTS.VOLUME_DB}
            onToggle={() => toggleLoopAt(i)}
            onVolumeChange={(value) => handleLoopVolumeChangeAt(i, { target: { value } })}
          />
        ))}
      </div>
      
      {/* User loops */}
      <div className="user-loops-section">
        <h3>Your Loops</h3>
        {userLoops.map((loop, i) => (
          <div key={loop.id} className="loop-control">
            {!loop.url ? (
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id={`${loop.id}-upload`}
                  accept="audio/wav,audio/*"
                  onChange={(e) => handleUserLoopFileUpload(loop.id, e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={() => document.getElementById(`${loop.id}-upload`).click()}
                  className="file-upload-btn"
                >
                  Upload WAV
                </button>
              </div>
            ) : (
              <LoopControl
                label={`User Loop ${i + 1}`}
                playing={loop.playing}
                volume={loop.volume}
                hasUrl={!!loop.url}
                isUserLoop={true}
                onToggle={() => toggleUserLoop(loop.id)}
                onVolumeChange={(value) => handleUserLoopVolumeChange(loop.id, value)}
                onClear={() => handleClearUserLoop(loop.id)}
              >
                <button 
                  onClick={() => handleClearUserLoop(loop.id)}
                  className="clear-file-btn"
                >
                  Clear
                </button>
              </LoopControl>
            )}
          </div>
        ))}
        
        {userLoops.length < USER_LOOP_CONFIG.MAX_USER_LOOPS && (
          <button 
            onClick={addUserLoop}
            className="add-loop-btn"
          >
            + Add Loop
          </button>
        )}
      </div>
    </div>
  );
};

export default Mixer;