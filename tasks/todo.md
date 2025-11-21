- [x] Fix `useCallback` dependency warning in `useDrumMachine.js`
- [x] Fix anonymous default export warning in `loopFactory.js`
- [x] Run `npm run build` to verify fixes

## Review

**1. `useCallback` dependency warning in `useDrumMachine.js`:**
   - **Change:** Removed `drumSounds` and `stepCount` from the dependency array of the `loadKit` `useCallback` hook on line 377.
   - **Reasoning:** These dependencies were redundant as `loadKit` transitively depended on them through the `rebuildSequencer` function, which was already in its dependency array. This change aligns with the `react-hooks/exhaustive-deps` linting rule.

**2. Anonymous default export warning in `loopFactory.js`:**
   - **Change:** Refactored the default export in `src/utils/loopFactory.js`. The exported object is now assigned to a named constant `LoopFactory` before being exported as default.
   - **Reasoning:** This addresses the `import/no-anonymous-default-export` linting warning by providing a named export, improving code readability and maintainability.

Both changes were verified by running `npm run build`, which completed successfully with no warnings.