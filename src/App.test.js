import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('tone', () => {
  return {
    __esModule: true,
    ...jest.requireActual('tone'),
    Transport: {
      bpm: { value: 0 },
      loop: false,
      state: 'stopped',
      start: jest.fn(),
      stop: jest.fn(),
    },
    Volume: jest.fn().mockImplementation(() => ({
      toDestination: jest.fn().mockReturnThis(),
      connect: jest.fn().mockReturnThis(),
      volume: { value: 0 },
    })),
    Filter: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      frequency: { value: 0 },
      Q: { value: 0 },
    })),
    MembraneSynth: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      triggerAttackRelease: jest.fn(),
    })),
    NoiseSynth: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      triggerAttack: jest.fn(),
    })),
    Synth: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      triggerAttackRelease: jest.fn(),
    })),
    Loop: jest.fn().mockImplementation((callback, interval) => ({
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      mute: false,
    })),
    Sequence: jest.fn().mockImplementation((callback, events, subdivision) => ({
        start: jest.fn().mockReturnThis(),
        dispose: jest.fn(),
    })),
    start: jest.fn(),
  };
});

test('renders BeatLab title', () => {
  render(<App />);
  const linkElement = screen.getByText(/BeatLab/i);
  expect(linkElement).toBeInTheDocument();
});