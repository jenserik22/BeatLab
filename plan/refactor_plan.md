# BeatLab Refactor Plan

## Overview
- Work proceeds in four sequential phases so each milestone can be reviewed and resumed independently.
- Update `plan/progress.json` after finishing a phase to keep the checkpoint in sync.

## Phase 1 – Audio Engine Lifecycle (Status: ✅ Completed)
**Goals**
- Register every Tone.js node (drum synths, loop synths, effects, filters) and dispose them on cleanup with transport shutdown safeguards.
- Use `triggerAttackRelease` for all noise-based hits to prevent lingering tails.
- Replace scattered console logging with an optional debug logger.

**Notes**
- Implemented on 2025-09-29; tests: `npm test -- --watch=false`.

## Phase 2 – Persistence & Error Handling (Status: ⬜ Pending)
**Goals**
- Guard `localStorage` access for non-browser environments and wrap parsing in `try/catch`.
- Validate saved pattern schema, merge with defaults, and preserve backward compatibility with older saves.
- Centralize persistence helpers for pattern, mixer, filter, and loop state.

**Suggested Steps**
1. Create utility to safely read/write storage keys with schema defaults.
2. Apply guards in `useDrumMachine` initializers and effects.
3. Add tests (unit or integration) covering malformed storage payloads.

## Phase 3 – Configuration Refactor (Status: ⬜ Pending)
**Goals**
- Replace per-loop state variables with array/object structures derived from a shared `loops` configuration.
- Extract shared constants (default BPM, step count, volume ranges) and memoize pattern templates based on `drumSounds` and `stepCount`.
- Keep UI components consuming the new configuration-driven state.

**Suggested Steps**
1. Define `LOOPS_CONFIG` and drum defaults in a constants module or within the hook.
2. Refactor mixer/sequencer props to read from the config-driven state.
3. Verify existing functionality and update tests.

## Phase 4 – Extensibility Enhancements (Status: ⬜ Pending)
**Goals**
- Support configurable sequencer step counts with persistence and Tone.Sequence updates.
- Externalize predefined patterns (per genre) with utilities to adapt to varying step lengths.
- Document data shapes via lightweight JSDoc typedefs (or TypeScript) for drum sounds and loop descriptors.

**Suggested Steps**
1. Introduce `stepCount` state with UI controls and migration for saved patterns.
2. Move predefined pattern data into dedicated module(s) and add generators.
3. Add typedefs/tests to ensure new configurations behave as expected.

## How to Resume
- Check `plan/progress.json` for phase status.
- Pick the next pending phase and follow its “Suggested Steps”.
- After completing a phase, rerun tests (`npm test -- --watch=false`) and update both this document and the progress file if scope changes.
