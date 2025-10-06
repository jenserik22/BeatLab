
import LZString from 'lz-string';

export const b64url = (value) => value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

export const fromB64url = (value) => {
  const converted = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (converted.length % 4 || 4)) % 4;
  return converted + '='.repeat(padding);
};

export const encodePattern = (patternData) => {
  try {
    const jsonString = JSON.stringify(patternData);
    return LZString.compressToEncodedURIComponent(jsonString);
  } catch (error) {
    console.error('Failed to encode pattern:', error);
    return '';
  }
};

export const decodePattern = (encodedString) => {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encodedString);
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Failed to decode pattern:', error);
    return null;
  }
};

export const encodePatternPayload = (patternData) => {
  try {
    const jsonString = JSON.stringify(patternData);
    const compressed = LZString.compressToBase64(jsonString);
    return b64url(compressed);
  } catch (error) {
    console.error('Failed to encode pattern payload:', error);
    return '';
  }
};

export const decodePatternPayload = (payload) => {
  try {
    const base64 = fromB64url(payload);
    const json = LZString.decompressFromBase64(base64);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Failed to decode pattern payload:', error);
    return null;
  }
};
