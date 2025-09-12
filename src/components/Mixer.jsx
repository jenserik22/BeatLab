import React from 'react';

const Mixer = ({
  drumSounds,
  drumVolumes,
  filterFreq,
  filterQ,
  loop1Playing,
  loop1Volume,
  loop2Playing,
  loop2Volume,
  loop3Playing,
  loop3Volume,
  loop4Playing,
  loop4Volume,
  loop5Playing,
  loop5Volume,
  loop6Playing,
  loop6Volume,
  handleDrumVolumeChange,
  handleFilterFreqChange,
  handleFilterQChange,
  toggleLoop1,
  handleLoop1VolumeChange,
  toggleLoop2,
  handleLoop2VolumeChange,
  toggleLoop3,
  handleLoop3VolumeChange,
  toggleLoop4,
  handleLoop4VolumeChange,
  toggleLoop5,
  handleLoop5VolumeChange,
  toggleLoop6,
  handleLoop6VolumeChange,
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
                min="-40"
                max="0"
                step="1"
                value={drumVolumes[sound.name]}
                onChange={(e) => handleDrumVolumeChange(sound.name, e.target.value)}
              />
              <span>{drumVolumes[sound.name]} dB</span>
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
        <div className="loop-control">
          <button onClick={toggleLoop1} className={loop1Playing ? 'active' : ''}>Synth Arp</button>
          <div className="volume-control">
            <label htmlFor="loop1-volume">Volume: {loop1Volume} dB</label>
            <input
              type="range"
              id="loop1-volume"
              min="-40"
              max="0"
              step="1"
              value={loop1Volume}
              onChange={handleLoop1VolumeChange}
            />
          </div>
        </div>
        <div className="loop-control">
          <button onClick={toggleLoop2} className={loop2Playing ? 'active' : ''}>Piano</button>
          <div className="volume-control">
            <label htmlFor="loop2-volume">Volume: {loop2Volume} dB</label>
            <input
              type="range"
              id="loop2-volume"
              min="-40"
              max="0"
              step="1"
              value={loop2Volume}
              onChange={handleLoop2VolumeChange}
            />
          </div>
        </div>
        <div className="loop-control">
          <button onClick={toggleLoop3} className={loop3Playing ? 'active' : ''}>Techno</button>
          <div className="volume-control">
            <label htmlFor="loop3-volume">Volume: {loop3Volume} dB</label>
            <input
              type="range"
              id="loop3-volume"
              min="-40"
              max="0"
              step="1"
              value={loop3Volume}
              onChange={handleLoop3VolumeChange}
            />
          </div>
        </div>
        <div className="loop-control">
          <button onClick={toggleLoop4} className={loop4Playing ? 'active' : ''}>Ambient Pad</button>
          <div className="volume-control">
            <label htmlFor="loop4-volume">Volume: {loop4Volume} dB</label>
            <input
              type="range"
              id="loop4-volume"
              min="-40"
              max="0"
              step="1"
              value={loop4Volume}
              onChange={handleLoop4VolumeChange}
            />
          </div>
        </div>
        <div className="loop-control">
          <button onClick={toggleLoop5} className={loop5Playing ? 'active' : ''}>Pluck Synth</button>
          <div className="volume-control">
            <label htmlFor="loop5-volume">Volume: {loop5Volume} dB</label>
            <input
              type="range"
              id="loop5-volume"
              min="-40"
              max="0"
              step="1"
              value={loop5Volume}
              onChange={handleLoop5VolumeChange}
            />
          </div>
        </div>
        <div className="loop-control">
          <button onClick={toggleLoop6} className={loop6Playing ? 'active' : ''}>Glitchy Perc</button>
          <div className="volume-control">
            <label htmlFor="loop6-volume">Volume: {loop6Volume} dB</label>
            <input
              type="range"
              id="loop6-volume"
              min="-40"
              max="0"
              step="1"
              value={loop6Volume}
              onChange={handleLoop6VolumeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mixer;