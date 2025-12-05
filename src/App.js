import React, { useState, useEffect } from 'react';
import { decodePattern, decodePatternPayload } from './utils/url';
import * as Tone from 'tone';
import './App.css';
import './components/FrequencySpectrum.css';


import Sequencer from './components/Sequencer';
import Transport from './components/Transport';
import Mixer from './components/Mixer';
import Visualizer from './components/Visualizer';
import PulsingBackground from './components/PulsingBackground';

import Patterns from './components/Patterns';
import KitSelector from './components/KitSelector';
import { useDrumMachine } from './hooks/useDrumMachine';
import { loadPatternById } from './services/shareStore';

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

  useEffect(() => {
    const restoreSpaPath = () => {
      if (typeof window === 'undefined') return;
      const { search, origin, hash } = window.location;
      if (!search.startsWith('?')) return;
      const params = new URLSearchParams(search);
      const path = params.get('p');
      if (!path || !path.startsWith('/')) return;
      const query = params.get('q');
      const fragment = params.get('h');
      const nextSearch = query ? `?${query}` : '';
      const nextHash = fragment ? `#${fragment}` : hash;
      window.history.replaceState(null, '', `${origin}${path}${nextSearch}${nextHash}`);
    };

    const clearParams = (keys) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      let changed = false;
      keys.forEach((key) => {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      });
      if (changed) {
        window.history.replaceState(null, '', `${url.origin}${url.pathname}${url.search}${url.hash}`);
      }
    };

    const tryLoadById = async (url) => {
      const segments = url.pathname.split('/').filter(Boolean);
      if (!segments.length) return false;
      const candidate = segments[segments.length - 1];
      const idPattern = /^[A-Za-z0-9]{1,10}$/;
      const isBasePath = segments.length === 1 && segments[0].toLowerCase() === 'beatlab';
      if (!idPattern.test(candidate) || isBasePath) {
        return false;
      }

      try {
        const data = await loadPatternById(candidate);
        if (data) {
          drumMachine.loadPattern('Shared Pattern', data);
          return true;
        }
      } catch (error) {
        console.error('Failed to load shared pattern by id:', error);
      }
      return false;
    };

    const tryLoadFromPayload = (url) => {
      const payloadParam = url.searchParams.get('p');
      if (!payloadParam || payloadParam.startsWith('/')) {
        return false;
      }
      const decoded = decodePatternPayload(payloadParam);
      if (!decoded) {
        return false;
      }
      drumMachine.loadPattern('Shared Pattern', decoded);
      clearParams(['p']);
      return true;
    };

    const tryLoadLegacy = (url) => {
      const patternParam = url.searchParams.get('pattern');
      if (!patternParam) {
        return false;
      }
      const decoded = decodePattern(patternParam);
      if (!decoded) {
        return false;
      }
      drumMachine.loadPattern('Shared Pattern', decoded);
      clearParams(['pattern']);
      return true;
    };

    const init = async () => {
      restoreSpaPath();
      const currentUrl = new URL(window.location.href);
      if (await tryLoadById(currentUrl)) return;
      if (tryLoadFromPayload(currentUrl)) return;
      tryLoadLegacy(currentUrl);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
          <PulsingBackground />
          <h1>BeatLab</h1>
          <button onClick={startAudioContext}>Start Creating</button>
        </div>
      ) : (
        <div className="app-container">
          <div className="middle-column">
            <Transport 
            isPlaying={drumMachine.isPlaying}
            isLooping={drumMachine.isLooping}
            bpm={drumMachine.bpm}
            stepCount={drumMachine.stepCount}
            masterVolume={drumMachine.masterVolume}
            handlePlay={drumMachine.handlePlay}
            handleStop={drumMachine.handleStop}
            toggleLoop={drumMachine.toggleLoop}
            handleBpmChange={drumMachine.handleBpmChange}
            handleStepCountChange={drumMachine.handleStepCountChange}
            handleMasterVolumeChange={drumMachine.handleMasterVolumeChange}
            getSharablePatternUrl={drumMachine.getSharablePatternUrl}
            drumSounds={drumSounds}
            pattern={drumMachine.pattern}
            drumVolumes={drumMachine.drumVolumes}
            filterFreq={drumMachine.filterFreq}
            filterQ={drumMachine.filterQ}
            loopPlaying={drumMachine.loopPlaying}
            loopVolume={drumMachine.loopVolume}
            loop1={drumMachine.loop1}
            loop2={drumMachine.loop2}
            loop3={drumMachine.loop3}
            loop4={drumMachine.loop4}
            loop5={drumMachine.loop5}
            loop6={drumMachine.loop6}
            userLoops={drumMachine.userLoops}
            currentKit={drumMachine.currentKit}
          />
            <KitSelector currentKit={drumMachine.currentKit} loadKit={drumMachine.loadKit} />
            <Patterns {...drumMachine} predefinedPatterns={drumMachine.predefinedPatterns} />
            <Sequencer {...drumMachine} drumSounds={drumSounds} />
            <Visualizer {...drumMachine} />
          </div>
          <div className="right-column">
            <Mixer 
            {...drumMachine} 
            drumSounds={drumSounds}
            swing={drumMachine.swing}
            handleSwingChange={drumMachine.handleSwingChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

