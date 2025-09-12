import React, { useRef, useEffect } from 'react';

const Visualizer = ({ analyser }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      if (analyser) {
        const frequencies = analyser.getValue();
        const bufferLength = frequencies.length;
        const barWidth = (canvas.width / bufferLength);
        let barHeight;
        let x = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (frequencies[i] + 140) * 1.5;

          const r = barHeight + (25 * (i / bufferLength));
          const g = 250 * (i / bufferLength);
          const b = 50;

          ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth;
        }
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser]);

  return (
    <div className="visualizer-card">
      <h3>Visualizer</h3>
      <canvas ref={canvasRef} width="150" height="150" />
    </div>
  );
};

export default Visualizer;
