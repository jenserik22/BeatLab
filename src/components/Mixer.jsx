import React from 'react';
import { LOOPS_CONFIG, DEFAULTS } from '../constants/config';
import { dbToPercent, percentToDb } from '../utils/volume';

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
        </div>
      </div>
      <div className="background-loops">
        <h3>Background Loops</h3>
        {LOOPS_CONFIG.map((loop, i) => (
          <div key={loop.id} className="loop-control">
            <button onClick={() => toggleLoopAt(i)} className={loopPlaying?.[i] ? 'active' : ''}>
              {loop.label}
            </button>
            <div className="volume-control">
              <label htmlFor={`${loop.id}-volume`}>Volume: {loopVolume?.[i]} dB</label>
              <input
                type="range"
                id={`${loop.id}-volume`}
                min={DEFAULTS.VOLUME_MIN}
                max={DEFAULTS.VOLUME_MAX}
                step="1"
                value={loopVolume?.[i] ?? DEFAULTS.VOLUME_DB}
                onChange={(e) => handleLoopVolumeChangeAt(i, e)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mixer;