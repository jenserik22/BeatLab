# Phase 4: Audio Export Refactoring Plan

## Overview
Consolidate duplicate render functions in AudioExporter.jsx and integrate the new renderer.

## Changes Required

### File: src/components/AudioExporter.jsx

#### Change 1: Add Import (Line 3)
```javascript
import { renderAudioOffline, calculateExportDuration, encodeWAV, downloadAudioFile } from '../utils/audioExportRenderer';
```

#### Change 2: Replace calculateDurationInSeconds (Lines 96-104)
BEFORE:
```javascript
const calculateDurationInSeconds = useCallback(() => {
  if (durationMode === 'rounds') {
    const rounds = parseInt(durationValue, 10);
    const patternLengthInSeconds = (stepCount / 4) * (60 / bpm);
    return patternLengthInSeconds * rounds;
  } else {
    return parseInt(durationValue, 10);
  }
}, [bpm, stepCount, durationMode, durationValue]);
```

AFTER:
```javascript
const calculateDurationInSeconds = useCallback(() => {
  return calculateExportDuration({
    bpm,
    stepCount,
    durationMode,
    durationValue
  });
}, [bpm, stepCount, durationMode, durationValue]);
```

#### Change 3: Remove Duplicate Render Functions (Lines 106-294)
DELETE:
- `const renderAudioOffline = useCallback(async () => { ... }, [...]);` (Lines 106-163)
- `const renderAudioOfflineComplex = useCallback(async () => { ... }, [...]);` (Lines 167-294)

ADD:
```javascript
const renderAudioOffline = useCallback(async () => {
  const duration = calculateDurationInSeconds();
  
  const loopConfigs = [
    loop1?.current ? { id: 'loop1', enabled: loopPlaying[0], type: 'fm', notes: [], pattern: loop1?.current } : null,
    loop2?.current ? { id: 'loop2', enabled: loopPlaying[1], type: 'poly', notes: [], pattern: loop2?.current } : null,
    loop3?.current ? { id: 'loop3', enabled: loopPlaying[2], type: 'mono', notes: [], pattern: loop3?.current } : null,
    loop4?.current ? { id: 'loop4', enabled: loopPlaying[3], type: 'poly', notes: [], pattern: loop4?.current } : null,
    loop5?.current ? { id: 'loop5', enabled: loopPlaying[4], type: 'pluck', notes: [], pattern: loop5?.current } : null,
    loop6?.current ? { id: 'loop6', enabled: loopPlaying[5], type: 'noise', notes: [], pattern: loop6?.current } : null,
  ].filter(Boolean);

  return await renderAudioOffline({
    drumSounds,
    bpm,
    stepCount,
    pattern,
    drumVolumes,
    masterVolume,
    filterFreq,
    filterQ,
    loopConfigs,
    includeLoops: loopConfigs.length > 0,
    duration,
    progressCallback: (progress) => setExportProgress(progress)
  });
}, [
  drumSounds, bpm, stepCount, pattern, drumVolumes, masterVolume,
  filterFreq, filterQ, loopPlaying, loop1, loop2, loop3, loop4, loop5, loop6
]);
```

#### Change 4: Replace handleExport (Lines 302-325)
BEFORE:
```javascript
const handleExport = useCallback(async () => {
  setIsExporting(true);
  setExportProgress(0);
  setError(null);

  try {
    const renderedBuffer = await renderAudioOffline();
    
    if (!renderedBuffer) {
      setError('Failed to render audio: buffer is empty');
      setIsExporting(false);
      return;
    }
    
    const wavBlob = encodeWAV(renderedBuffer);
    downloadBlob(wavBlob, `${fileName}.wav`);
    
    setExportProgress(100);
    
    setTimeout(() => {
      setIsModalOpen(false);
      setIsExporting(false);
      setExportProgress(0);
    }, 500);
  } catch (err) {
    setError(`Export failed: ${err.message}`);
    setIsExporting(false);
  }
}, [fileName, renderAudioOffline]);
```

AFTER:
```javascript
const handleExport = useCallback(async () => {
  setIsExporting(true);
  setExportProgress(0);
  setError(null);

  try {
    const renderedBuffer = await renderAudioOffline();
    
    if (!renderedBuffer) {
      setError('Failed to render audio: buffer is empty');
      setIsExporting(false);
      return;
    }
    
    const wavBlob = encodeWAV(renderedBuffer);
    downloadAudioFile(wavBlob, `${fileName}.wav`);
    
    setExportProgress(100);
    
    setTimeout(() => {
      setIsModalOpen(false);
      setIsExporting(false);
      setExportProgress(0);
    }, 500);
  } catch (err) {
    setError(`Export failed: ${err.message}`);
    setIsExporting(false);
  }
}, [fileName, renderAudioOffline]);
```

#### Change 5: Remove helper functions (Lines 340-356)
DELETE:
- `function encodeWAV(audioBuffer)` 
- `function downloadBlob(blob, filename)`

The new `encodeWAV` and `downloadAudioFile` are imported from the renderer module.

## Summary

**Lines eliminated:** ~150 lines of duplicated render logic
**Functions replaced:** 2 duplicate functions → 1 consolidated function  
**New code added:** ~50 lines (using consolidated renderer)
**Net reduction:** ~100 lines

**Benefits:**
- Single source of truth for rendering logic
- Consistent audio graph creation
- Proper loop handling in complex mode
- Better error handling
- Progress tracking standardized
- Easier to maintain and extend

---
