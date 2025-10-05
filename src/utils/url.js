
import LZString from 'lz-string';

export const encodePattern = (patternData) => {
  try {
    const jsonString = JSON.stringify(patternData);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    return compressed;
  } catch (error) {
    console.error('Failed to encode pattern:', error);
    return '';
  }
};

export const decodePattern = (encodedString) => {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encodedString);
    const patternData = JSON.parse(decompressed);
    return patternData;
  } catch (error) {
    console.error('Failed to decode pattern:', error);
    return null;
  }
};
