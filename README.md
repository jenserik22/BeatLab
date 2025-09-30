# BeatLab

BeatLab is a browser-based drum machine and step sequencer built with React and Tone.js, allowing users to create, play, and save drum patterns. It includes adjustable step sequencing (8–32 steps) with non-destructive step changes, background loops, mixer and global filter controls, BPM control, and an audio visualizer.

## Key Features

*   **Adjustable Step Sequencer (8–32):** Program patterns with non-destructive step changes (increasing adds blank steps; decreasing truncates only the end).
*   **8 Drum Sounds:** Includes Kick, Snare, Closed Hi-Hat, Open Hi-Hat, Clap, Crash, Tom Low, and Tom High.
*   **Playback Controls:** Play, stop, BPM control, and loop toggle.
*   **Pattern Management:** Load predefined patterns (auto-adapt to current step count), save your own patterns to local storage, and delete them. Saved data is backward-compatible with earlier versions.
*   **Mixer:** Adjust the volume of each individual drum sound and the master volume.
*   **Global Filter:** A low-pass filter with frequency and resonance controls that affects the entire mix.
*   **Background Loops:** Six different background loops with individual play/stop and volume controls.
*   **Audio Visualizer:** A real-time spectrum analyzer that visualizes the master audio output.

## Technologies Used

*   **React:** For building the user interface.
*   **Tone.js:** For all audio-related functionality, including synthesis, sequencing, and effects.
*   **HTML/CSS:** For the structure and styling of the application.

## How to Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Start the Development Server:**
    ```bash
    npm start
    ```
3.  Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Usage

* Click "Click to Start" to enable audio (required by browser autoplay policies).
* Use Transport to Play/Stop, toggle Loop, adjust BPM and Master Volume, and select Step Count.
* Toggle steps in the Sequencer grid to program rhythms; changing step count preserves existing steps and adds blanks when increasing.

## Project Structure

*   `src/App.js`: The main application component.
*   `src/hooks/useDrumMachine.js`: A custom hook that contains the core logic of the drum machine.
*   `src/utils/storage.js`: Local storage, normalization, and pattern step adaptation helpers.
*   `src/patterns/index.js`: Predefined patterns (base 16) adapted to current step count.
*   `src/components/`: Contains all the React components for the application.
    *   `Sequencer.jsx`: The sequencer grid (step count adjustable).
    *   `Transport.jsx`: Playback controls (Play, Stop, BPM, Loop, Step Count, Master Volume).
    *   `Mixer.jsx`: The mixer controls for drum volumes, filter, and background loops.
    *   `Patterns.jsx`: The pattern management controls.
    *   `Visualizer.jsx`: The audio visualizer.
*   `public/`: Contains the static assets for the application.

## Testing and Building

* Run tests:
  ```bash
  npm test
  ```
* Create a production build:
  ```bash
  npm run build
  ```

## Troubleshooting

* No sound? Click the start button to enable audio; some browsers block audio until user interaction.
* If patterns look different after changing steps, ensure you’re on the latest version; step changes are non-destructive (existing steps are preserved).