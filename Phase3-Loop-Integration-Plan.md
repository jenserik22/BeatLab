# Phase 3: Loop System Integration Plan

## Overview
Complete the integration of loopFactory into useDrumMachine.js to eliminate 200+ lines of duplication.

---

## Step 1: Replace Loop Initialization (Lines 177-370)

### Current Code (200 lines)
```javascript
// ~200 lines of repetitive loop initialization
loop1Synth.current = new Tone.FMSynth({...}).connect(delay);
loop1.current = new Tone.Part(...).start(0);
// ... repeated 6 times with slight variations
```

### Replacement (5 lines)
```javascript
// Create all loops using factory
const { synthRefs, loopRefs } = createBuiltinLoops(masterVol.current, registerEffectNode);
loopSynths.current = synthRefs;
loops.current = loopRefs;
```

---

## Step 2: Update Cleanup Code (Lines 407-420)

### Current Code
```javascript
loopRefs.forEach(loopRef => {
  if (loopRef.current) {
    loopRef.current.stop(0);
    loopRef.current.dispose();
    loopRef.current = null;
  }
});

loopSynthRefs.forEach(loopSynthRef => {
  if (loopSynthRef.current) {
    loopSynthRef.current.dispose();
    loopSynthRef.current = null;
  }
});
```

### Replacement
```javascript
loops.current.forEach(loopRef => {
  if (loopRef?.current) {
    loopRef.current.stop(0);
    loopRef.current.dispose();
    loopRef.current = null;
  }
});

loopSynths.current.forEach(synthRef => {
  if (synthRef?.current) {
    synthRef.current.dispose();
    synthRef.current = null;
  }
});
```

---

## Step 3: Update Loop Control References

### Find and replace these patterns:

1. In `handlePlay` and `handleStop`:
   ```javascript
   // Before
   loopRefs.forEach(loopRef => { ... });
   
   // After
   loops.current.forEach(loopRef => { ... });
   ```

2. In volume effect:
   ```javascript
   // Before
   const synthRefs = [loop1Synth, loop2Synth, loop3Synth, ...];
   
   // After
   loopSynths.current.forEach((ref, i) => { ... });
   ```

3. In return statement:
   ```javascript
   // Before
   loop1: loop1.current,
   loop2: loop2.current,
   ...
   
   // After (use array or map)
   loop1: loops.current[0]?.current || null,
   loop2: loops.current[1]?.current || null,
   ...
   ```

---

## Step 4: Testing Checklist

- [ ] All 6 loops create without errors
- [ ] Loop enable/disable works
- [ ] Loop volume controls work
- [ ] Audio export captures loops
- [ ] No console errors
- [ ] No breaking changes to transport controls

---

## Files Modified

1. `src/hooks/useDrumMachine.js` (main changes)
   - Remove: Individual loop refs (12 useRef calls)
   - Remove: Loop initialization (~200 lines)
   - Remove: Individual cleanup calls
   - Add: Array-based loop management (20-30 lines)
   - Add: Single factory call (3-5 lines)

---

## Expected Results

### Lines Reduced
- Individual loop init: ~200 lines → ~5 lines
- Cleanup code: ~20 lines → ~10 lines
- **Total: ~205 lines eliminated**

### Maintainability
- Adding new loop: 5 minutes (vs 1 hour)
- Changing loop settings: Edit config file
- Debugging: Single code path

### Test Coverage
- 18 tests for loopFactory (already created)
- Manual testing required for audio
- Integration tests for useDrumMachine

---

## Risk Assessment

**Medium Risk**
- Audio routing is critical
- Multiple dependencies on loop refs
- Need careful testing

**Mitigation**
- Keep backup of original
- Test each loop individually
- Verify export still works
- Check volume/mute controls

---

## Integration Order

1. ✅ Add loopFactory import (done)
2. ✅ Replace individual refs with arrays (done)
3. ⏳ Replace loop initialization (next)
4. ⏳ Update cleanup code
5. ⏳ Fix all references to loops
6. ⏳ Test thoroughly
7. ⏳ Verify audio export works

---

## Current Status

**Progress: 2/7 steps completed**  
**Lines eliminated: 12 so far**  
**Estimated completion: 30-45 minutes**  

**Ready to proceed with Step 3 when API limits reset.**

The foundation is solid - we have all the utilities built and tested. Integration just needs careful replacement of the repetitive code with our factory functions.

---
