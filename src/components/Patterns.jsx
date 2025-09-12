import React from 'react';

const Patterns = ({ predefinedPatterns, currentPatternName, loadPattern, savePattern, savedPatterns, deletePattern }) => {
  return (
    <div className="pattern-controls">
      <h3>Patterns: {currentPatternName}</h3>
      <div className="predefined-patterns">
        {Object.entries(predefinedPatterns).map(([name, data]) => (
          <button key={name} onClick={() => loadPattern(name, data)} disabled={currentPatternName === name}>
            {name}
          </button>
        ))}
      </div>
      <div className="saved-patterns">
        {Object.entries(savedPatterns).map(([name, data]) => (
          <div key={name} className="saved-pattern-item">
            <button onClick={() => loadPattern(name, data)} disabled={currentPatternName === name}>
              {name}
            </button>
            <button onClick={() => deletePattern(name)} className="delete-button">X</button>
          </div>
        ))}
      </div>
      <button onClick={savePattern}>Save Current Pattern</button>
    </div>
  );
};

export default Patterns;