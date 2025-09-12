# BeatLab

BeatLab is a web-based music synthesis application built with React and Tone.js. It functions as a drum machine and sequencer, allowing users to create, play, and save drum patterns.

## Key Features

*   **16-Step Sequencer:** Program drum patterns across 16 steps for each instrument.
*   **8 Drum Sounds:** Includes Kick, Snare, Closed Hi-Hat, Open Hi-Hat, Clap, Crash, Tom Low, and Tom High.
*   **Playback Controls:** Play, stop, and adjust the BPM (Beats Per Minute).
*   **Pattern Management:** Load predefined patterns, save your own patterns to local storage, and delete them.
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

## Project Structure

*   `src/App.js`: The main application component.
*   `src/hooks/useDrumMachine.js`: A custom hook that contains the core logic of the drum machine.
*   `src/components/`: Contains all the React components for the application.
    *   `Sequencer.jsx`: The 16-step sequencer grid.
    *   `Transport.jsx`: The playback controls (play, stop, BPM).
    *   `Mixer.jsx`: The mixer controls for drum volumes, filter, and background loops.
    *   `Patterns.jsx`: The pattern management controls.
    *   `Visualizer.jsx`: The audio visualizer.
*   `public/`: Contains the static assets for the application.