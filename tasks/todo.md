# Plan for changing pattern step adjustment logic

1.  [x] **Understand the issue:** The user finds the current pattern "scaling" (repeating) behavior confusing when changing the number of steps. The desired behavior is to preserve the user's pattern and add or remove steps from the end.
2.  [x] **Locate the relevant code:** The logic for this is in `adaptPatternToStepCount` function within `src/utils/patternBuilder.js`.
3.  [x] **Modify `adaptPatternToStepCount`:** Update the function to pad the pattern with empty steps (false values) when the step count is increased, instead of repeating the existing pattern. The truncation logic for decreasing steps is correct and will remain.
4.  [ ] **Verify the change:** Although I can't run the app, I will review the code to ensure it logically produces the desired, more intuitive outcome. I will also confirm this change doesn't break other parts of the pattern generation/handling logic.
5.  [ ] **Summarize changes:** Create a review section in this file summarizing the changes.

---

## Review of Changes

The `adaptPatternToStepCount` function in `src/utils/patternBuilder.js` was modified.

**Old behavior (when `sourcePattern.length < targetStepCount`):**
```javascript
      adapted[sound.name] = [];
      for (let i = 0; i < targetStepCount; i++) {
        adapted[sound.name][i] = sourcePattern[i % sourcePattern.length] || false;
      }
```
This code repeated the existing pattern to fill the new, larger step count.

**New behavior (when `sourcePattern.length < targetStepCount`):**
```javascript
      adapted[sound.name] = [
        ...sourcePattern, 
        ...Array(targetStepCount - sourcePattern.length).fill(false)
      ];
```
This code now pads the existing pattern with `false` values (empty steps) when the step count is increased, preserving the original pattern and adding new, empty steps at the end. The truncation logic for decreasing steps remains unchanged.

This change makes the behavior of adjusting step counts more intuitive for the user, as it avoids unexpected pattern repetitions. It aligns with the user's expectation of preserving their existing composition and simply extending it with empty steps.