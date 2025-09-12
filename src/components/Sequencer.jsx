import React from 'react';

const Sequencer = ({ drumSounds, pattern, currentStep, toggleStep }) => {
  return (
    <div className="sequencer-card">
      <h3>Sequencer</h3>
      <div className="sequencer-grid">
        {drumSounds.map(sound => (
          <div key={sound.name} className="drum-row">
            <div className="drum-label">{sound.name}</div>
            <div className="steps">
              {pattern[sound.name].map((isActive, stepIndex) => (
                <div
                  key={stepIndex}
                  className={`step ${isActive ? 'active' : ''} ${currentStep === stepIndex ? 'current' : ''}`}
                  onClick={() => toggleStep(sound.name, stepIndex)}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sequencer;