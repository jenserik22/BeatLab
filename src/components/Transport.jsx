import React, { useEffect, useRef, useState } from 'react';
import { dbToPercent, percentToDb } from '../utils/volume';
import { DEFAULTS } from '../constants/config';

const Transport = ({ isPlaying, isLooping, bpm, stepCount, masterVolume, handlePlay, handleStop, toggleLoop, handleBpmChange, handleStepCountChange, handleMasterVolumeChange, getSharablePatternUrl }) => {
  const [shareStatus, setShareStatus] = useState(null);
  const shareTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = null;
    }
  }, []);

  const showShareStatus = (message, tone = 'success', url = null) => {
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
    }
    setShareStatus({ message, tone, url });
    shareTimeoutRef.current = setTimeout(() => {
      setShareStatus(null);
      shareTimeoutRef.current = null;
    }, 3000);
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_err) {
      /* fall back */
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  };

  const handleShare = async () => {
    try {
      const result = await getSharablePatternUrl();
      const copied = await copyToClipboard(result.url);
      if (copied) {
        showShareStatus(
          result.isFallback
            ? 'Copied fallback share link (offline mode).'
            : 'Share link copied to clipboard.'
        );
      } else {
        showShareStatus('Copy this link manually:', 'error', result.url);
      }
    } catch (error) {
      console.error('Failed to copy sharable URL:', error);
      showShareStatus('Unable to copy share link. Try again.', 'error');
    }
  };

  return (
    <div className="transport-controls">
      <button onClick={handlePlay} disabled={isPlaying}>Play</button>
      <button onClick={handleStop} disabled={!isPlaying}>Stop</button>
      <button onClick={toggleLoop} className={isLooping ? 'active' : ''}>Loop</button>
      <button onClick={handleShare}>Share</button>
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
        <label htmlFor="master-volume">Volume: {dbToPercent(masterVolume)}%</label>
        <input
          type="range"
          id="master-volume"
          min="0"
          max="100"
          step="1"
          value={dbToPercent(masterVolume)}
          onChange={(e) => {
            const db = percentToDb(parseFloat(e.target.value), DEFAULTS.VOLUME_MIN, DEFAULTS.VOLUME_MAX);
            handleMasterVolumeChange({ target: { value: db } });
          }}
        />
      </div>
      {shareStatus && (
        <div
          className={`share-status share-status--${shareStatus.tone}`}
          role="status"
        >
          <span>{shareStatus.message}</span>
          {shareStatus.url && (
            <span className="share-status__url"> {shareStatus.url}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Transport;