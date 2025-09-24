import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';

const FrequencySpectrum = ({ isPlaying = false, analyser }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const prevHeightsRef = useRef(new Array(64).fill(0));
  const barCount = 64;
  const topPaddingRatio = 0.1; // 10% padding at the top
  const smoothing = 0.6; // 0 = no smoothing, 1 = very slow

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying && analyser) {
        const fftData = analyser.getValue();
        const barWidth = canvas.width / barCount;
        const topPadding = canvas.height * topPaddingRatio;
        const maxBarHeight = canvas.height - topPadding;
        const prevHeights = prevHeightsRef.current;

        for (let i = 0; i < barCount; i++) {
          const value = fftData[i * 2] || -100;
          const height = Math.max(0, Math.min(100, (value + 100) * 2.5));
          const barHeight = (height / 100) * maxBarHeight;

          // Smooth the bar height
          prevHeights[i] = prevHeights[i] * smoothing + barHeight * (1 - smoothing);

          const x = i * barWidth;
          const y = canvas.height - prevHeights[i];

          // Create a vertical gradient for each bar
          const gradient = ctx.createLinearGradient(x, y, x, y + prevHeights[i]);
          gradient.addColorStop(0, '#00ffff'); // Top: cyan
          gradient.addColorStop(1, '#ff00ff'); // Bottom: magenta

          ctx.fillStyle = gradient;
          ctx.fillRect(x + 2, y, barWidth - 4, prevHeights[i]);
        }
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      prevHeightsRef.current = new Array(barCount).fill(0);
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
      <canvas
        ref={canvasRef}
        width={640}
        height={120}
        style={{ width: '100%', height: '120px', background: '#222' }}
      />
    </div>
  );
};

export default FrequencySpectrum;