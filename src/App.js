import React, { useState } from 'react';
import * as Tone from 'tone';
import './App.css';
import './components/FrequencySpectrum.css';


import Sequencer from './components/Sequencer';
import Transport from './components/Transport';
import Mixer from './components/Mixer';
import Visualizer from './components/Visualizer';

import Patterns from './components/Patterns';
import { useDrumMachine } from './hooks/useDrumMachine';

const drumSounds = [
  { name: 'Kick', note: 'C2', type: 'membrane' },
  { name: 'Snare', note: 'E2', type: 'noise' },
  { name: 'Closed Hi-Hat', note: 'F#2', type: 'noise' },
  { name: 'Open Hi-Hat', note: 'A#2', type: 'noise' },
  { name: 'Clap', note: 'C#3', type: 'noise' },
  { name: 'Crash', note: 'F3', type: 'noise' },
  { name: 'Tom Low', note: 'D2', type: 'membrane' },
  { name: 'Tom High', note: 'G2', type: 'membrane' },
];

function App() {
  const [audioContextStarted, setAudioContextStarted] = useState(false);
  const drumMachine = useDrumMachine(drumSounds);

  const startAudioContext = async () => {
    try {
      console.log('Attempting to start audio context...');
      if (Tone.context.state !== 'running') {
        await Tone.context.resume(); // Explicitly resume the context
        console.log('Audio context resumed. State:', Tone.context.state);
      }
      // Also ensure Tone.start() is called, as it handles other Tone.js specific setups
      await Tone.start();
      console.log('Tone.start() completed. Audio context state:', Tone.context.state);

      // Audio ping to test sound output
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease('C4', '8n');
      console.log('Audio ping: C4 played.');
      setTimeout(() => synth.dispose(), 1000); // Dispose after a short delay

      setAudioContextStarted(true);
    } catch (error) {
      console.error('Failed to start audio context:', error);
      alert('Failed to start audio. Please check your browser console for more details.');
    }
  };

  return (
    <div className={`App ${!audioContextStarted ? 'welcome' : ''}`}>
      {!audioContextStarted ? (
        <div className="start-screen">
          <h1>BeatLab</h1>
          <button onClick={startAudioContext}>Click to Start</button>
        </div>
      ) : (
        <div className="app-container">
          <div className="middle-column">
            <Transport {...drumMachine} />
            <Patterns {...drumMachine} predefinedPatterns={drumMachine.predefinedPatterns} />
            <Sequencer {...drumMachine} drumSounds={drumSounds} />
            <Visualizer {...drumMachine} />
          </div>
          <div className="right-column">
            <Mixer {...drumMachine} drumSounds={drumSounds} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

