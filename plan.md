# Plan: Add a Spectrum Audio Analyzer to BeatLab

This document outlines the plan to add a full-width, visually impressive spectrum audio analyzer to the BeatLab application.

## Project Goal

To enhance the BeatLab user experience by adding a real-time audio visualizer that provides a "cool" graphical representation of the master audio output. The visualizer will be a full-width element at the bottom of the application for a seamless, integrated look.

---

## Phase 1: Core Integration (The "Plumbing")

This phase focuses on integrating the necessary audio analysis node into the existing audio processing chain.

*   **File to Modify:** `src/hooks/useDrumMachine.js`
*   **Steps:**
    1.  **Create an Analyzer Node:** Instantiate a `Tone.Analyser` node.
    2.  **Configure Analyzer:** Set the analyzer's type to `'fft'` and its size to `256`.
    3.  **Connect to Master Output:** Connect the `masterVol.current` to the new analyzer node.
    4.  **Expose the Analyzer:** Add the analyzer instance to the object returned by the `useDrumMachine` hook so it can be passed to the UI.

---

## Phase 2: Visualization & Graphics (The "Fun Part")

This phase focuses on creating the React component that will render the visualization.

*   **New File:** `src/components/Visualizer.jsx`
*   **Steps:**
    1.  **Create the Component:** Create a new React component named `Visualizer`.
    2.  **Add a Canvas:** Add an HTML5 `<canvas>` element to the component.
    3.  **Implement Render Loop:** Use `requestAnimationFrame` to create an efficient render loop that continuously draws to the canvas.
    4.  **Fetch Data:** In each frame of the loop, get the frequency data from the analyzer using `analyser.getValue()`.
    5.  **Implement "Cool GFX":**
        *   **Symmetrical Bar Graph:** Draw the frequency bars symmetrically from the center of the canvas outwards.
        *   **Vibrant Colors:** Use a color gradient for the bars that changes based on the audio intensity (e.g., blue for quiet, red for loud).
        *   **Peak Hold Indicators:** Add small lines at the top of each frequency bar that "hold" the peak value for a short period.
        *   **Dark Background:** Use a dark background for the canvas to make the colors pop.

---

## Phase 3: UI Implementation (Putting It All Together)

This phase focuses on placing the new `Visualizer` component into the application's layout.

*   **Files to Modify:** `src/App.js` and `src/App.css`
*   **Steps:**
    1.  **New Layout Structure:** Place the `Visualizer` component at the bottom of the `app-container`, outside of the multi-column layout, to allow it to span the full width.
    2.  **CSS Styling:** Add CSS to make the `Visualizer` a full-width block element with a fixed height and no margins or padding.
    3.  **Pass Props:** Pass the analyzer instance from the `useDrumMachine` hook to the `Visualizer` component as a prop.

---

## Mock-up Design

This mock-up illustrates the final design with the full-width visualizer at the bottom.

```
+--------------------------------------------------------------------------------------------------+
| BeatLab                                                                                          |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------+  +----------------------------------------------+  |
|  | Transport Controls (Play, Stop, BPM)      |  | Mixer Controls                               |  |
|  |-------------------------------------------|  |----------------------------------------------|  |
|  | [Play] [Stop] [Loop]  BPM: [----o--] 120   |  | +------------------------------------------+ |  |
|  +-------------------------------------------+  | | Drum Mix                                 | |  |
|                                               |  | | Kick:   [---o----]  -10dB                | |  |
|  +-------------------------------------------+  | | Snare:  [----o---]  -10dB                | |  |
|  | Patterns (Rock, Hip-Hop, etc.)            |  | | ...                                      | |  |
|  |-------------------------------------------|  | +------------------------------------------+ |  |
|  | [Rock Beat] [Hip-Hop] [Techno] [Save]     |  |                                              |  |
|  +-------------------------------------------+  | +------------------------------------------+ |  |
|                                               |  | | Background Loops                         | |  |
|  +-------------------------------------------+  | | [Synth Arp]  Volume: [---o----]          | |  |
|  | Sequencer Grid                            |  | | [Piano]      Volume: [----o---]          | |  |
|  |-------------------------------------------|  | | ...                                      | |  |
|  | Kick  [x] [ ] [ ] [ ] [x] [ ] [ ] [ ] ... |  | +------------------------------------------+ |  |
|  | Snare [ ] [ ] [ ] [ ] [x] [ ] [ ] [ ] ... |  |                                              |  |
|  | ...                                       |  |                                              |  |
|  +-------------------------------------------+  |                                              |  |
|                                               |  +----------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                            ▂▂▃▃▄▅▆▇████████████████████████████▇▆▅▄▃▃▂▂                             |
|                        ▂▂▃▃▄▅▆▇████████████████████████████████████▇▆ⅅ▄▃▃▂▂                         |
|                    ▂▂▃▃▄▅▆▇████████████████████████████████████████████▇▆▅▄▃▃▂▂                     |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```
