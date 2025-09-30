import React from 'react';

const Transport = ({ isPlaying, isLooping, bpm, stepCount, masterVolume, handlePlay, handleStop, toggleLoop, handleBpmChange, handleStepCountChange, handleMasterVolumeChange }) => {
  return (
    <div className="transport-controls">
      <button onClick={handlePlay} disabled={isPlaying}>Play</button>
      <button onClick={handleStop} disabled={!isPlaying}>Stop</button>
      <button onClick={toggleLoop} className={isLooping ? 'active' : ''}>Loop</button>
      <div className="bpm-control">
        <label htmlFor="bpm">BPM: {bpm}</label>
        <input
          type="range"
          id="bpm"
          min="60"
          max="180"
          value={bpm}
          onChange={handleBpmChange}
        />
      </div>
      <div className="stepcount-control">
        <label htmlFor="step-count">Steps: {stepCount}</label>
        <select id="step-count" value={stepCount} onChange={handleStepCountChange}>
          {[8, 12, 16, 24, 32].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="volume-control">
        <label htmlFor="master-volume">Volume: {masterVolume} dB</label>
        <input
          type="range"
          id="master-volume"
          min="-40"
          max="0"
          step="1"
          value={masterVolume}
          onChange={handleMasterVolumeChange}
        />
      </div>
    </div>
  );
};

export default Transport;