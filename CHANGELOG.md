# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 🚀 Features
*   Implemented Supabase integration for pattern sharing and loading.
*   Added a "Share" button for users to share their patterns.
*   Added saving for all project settings.
*   Initial commit - BeatLab drum machine with React and Tone.js.

### ✨ Enhancements
*   Enhanced the UI with a pulsing background effect and updated styles.
*   Upgraded the sequencer from 16 to 32 steps.
*   Centered the "Click to Start" screen vertically.
*   Switched background loop volume sliders to a 0–100% scale.
*   Updated master and drum mix volume sliders to a 0–100% scale.
*   Improved the visual contrast of the FrequencySpectrum gradient colors.
*   Removed the Performance Pads component and improved the FrequencySpectrum visualization.
*   Adjusted the UI to remove empty space.
*   Modernized the audio visualizer.

### 🐛 Fixes
*   Fixed an issue where background loops were not included in the share function.

### 📝 Documentation
*   Corrected the description of the 32-step sequencer in the `GEMINI.md` file.
*   Enhanced the `README.md` with more project details and sections for usage, testing, and building.

### 🔨 Refactoring & Chores
*   Refactored padding in pattern control components for consistent UI spacing.
*   Updated `.gitignore` to include the `.env` file.
*   Removed progress tracking files and refactored plan documentation.
*   Improved the `adaptPatternToStepCount` function for non-destructive resizing of patterns.
*   Refactored the Mixer and Transport components to streamline loop handling and volume controls.
*   Updated `.gitignore` to exclude plan artifacts and the `.playwright-mcp` folder.
*   Removed unused files and folders.
