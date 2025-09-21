import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const FrequencySpectrum = ({ isPlaying = false, masterVolume = 0, analyser }) => {
  const animationRef = useRef(null);
  const [frequencyData, setFrequencyData] = useState(new Array(64).fill(0));

  useEffect(() => {
    const updateVisualization = () => {
      if (isPlaying && analyser) {
        const fftData = analyser.getValue();
        const processedData = new Array(64);
        for (let i = 0; i < 64; i++) {
          const value = fftData[i * 2] || -100;
          const height = Math.max(0, Math.min(100, (value + 100) * 2.5));
          processedData[i] = height;
        }
        setFrequencyData(processedData);
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateVisualization);
      }
    };

    if (isPlaying) {
      updateVisualization();
    } else {
      setFrequencyData(new Array(64).fill(0));
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyser]);

  return (
    <div className="frequency-spectrum">
      <div className="spectrum-header">
        <h3>FREQUENCY SPECTRUM</h3>
        <span className={`status ${isPlaying ? 'active' : 'idle'}`}>
          {isPlaying ? '● ANALYZING' : '○ READY'}
        </span>
      </div>
      
      <div className="spectrum-bars">
        {frequencyData.map((height, index) => (
          <div
            key={index}
            className="freq-bar"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default FrequencySpectrum;