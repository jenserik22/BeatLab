# Hi-Hat Choke Implementation

This plan outlines the steps to implement a hi-hat choke mechanism, where a closed hi-hat sound will cut off (choke) an open hi-hat sound for a more realistic feel.

## Plan

1.  [completed] **Analyze `useDrumMachine.js`:** Understand how audio samples are loaded and played.
2.  [completed] **Modify `kitsConfig.js`:** Add metadata to the kit configurations to define the choke relationship between the closed hi-hat (choker) and the open hi-hat (choked).
3.  [completed] **Update `useDrumMachine.js`:** Implement the choke logic. When a "choker" sound is triggered, it will stop any currently playing "choked" sound.
4.  [completed] **Refactor `useDrumMachine.js` to use `useEffect`:** Ensure that the audio players are correctly managed and updated when the kit changes.
5.  [cancelled] **Test the feature:** Verify that playing a closed hi-hat correctly stops the open hi-hat sound.
6.  [in_progress] **Review and Finalize:** Add a summary of the changes to this document.

## Review Summary

The following changes were implemented to add a hi-hat choke feature:

*   **`src/constants/kitsConfig.js`**: The `chokes: ['Open Hi-Hat']` property was added to the 'Closed Hi-Hat' definition for all drum kits. This metadata indicates that when a 'Closed Hi-Hat' sound is played, it should cut off any active 'Open Hi-Hat' sound.
*   **`src/hooks/useDrumMachine.js`**:
    *   The `rebuildSequencer` function's `useCallback` dependency array was updated to include `currentKit`, ensuring that the sequencer is correctly rebuilt whenever the active drum kit changes.
    *   Choke logic was added within the `Tone.Sequence` callback. Before triggering a drum sound, it now checks if the sound has a `chokes` property defined in `currentKit.drums`. If so, it iterates through the sounds to be choked and calls `chokedSynth.triggerRelease(time)` to immediately stop them.
    *   Similar choke logic was added to the `playSound` function, which handles manual pad triggers. This ensures that manually playing a closed hi-hat will correctly choke an open hi-hat.
    *   The redundant call to `rebuildSequencer()` within the `loadKit` function was removed. The `useEffect` hook that depends on `rebuildSequencer` now handles the sequencer rebuild when `currentKit` or `stepCount` change, preventing duplicate rebuilds.
    *   The `useEffect` that calls `rebuildSequencer` now explicitly depends on `currentKit` and `stepCount`, in addition to `rebuildSequencer`, ensuring all relevant state changes trigger a sequencer rebuild.