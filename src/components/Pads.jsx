import React from 'react';

const Pads = ({ drumSounds, activePad, playSound }) => {
  return (
    <div className="performance-pads">
      <h3>Performance Pads</h3>
      <div className="pads-grid">
        {drumSounds.map(sound => (
          <button
            key={sound.name}
            className={`pad ${activePad === sound.name ? 'active' : ''}`}
            onMouseDown={() => playSound(sound.name)}
          >
            {sound.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Pads;