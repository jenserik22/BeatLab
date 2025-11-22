import React from 'react';
import { dbToPercent, percentToDb } from '../utils/volume';

const LoopControl = ({ 
  label, 
  playing, 
  volume,
  hasUrl = false,
  onToggle, 
  onVolumeChange,
  onFileUpload,
  onClear,
  isUserLoop = false,
  children
}) => {
  return (
    <div className="loop-control">
      {/* Show play button and volume if it's a predefined loop OR user loop with URL */}
      {!isUserLoop || hasUrl ? (
        <>
          <button onClick={onToggle} className={playing ? 'active' : ''}>
            {label}
          </button>
          <div className="volume-control">
            <label>{dbToPercent(volume)}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step="1"
              value={dbToPercent(volume)}
              onChange={(e) => onVolumeChange(percentToDb(parseFloat(e.target.value)))}
            />
          </div>
        </>
      ) : null}
      
      {isUserLoop && (
        <div className="loop-upload-controls">
          {!hasUrl ? (
            /* No file uploaded yet - show upload button */
            <div className="file-input-wrapper">
              <input
                type="file"
                id={`${label}-upload`}
                accept="audio/wav,audio/*"
                onChange={(e) => onFileUpload(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => document.getElementById(`${label}-upload`).click()}
                className="file-upload-btn"
              >
                Upload WAV
              </button>
            </div>
          ) : (
            /* File uploaded - show children (like clear button) */
            <>
              {children}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LoopControl;
