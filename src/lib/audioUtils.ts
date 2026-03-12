/**
 * Pure audio processing utilities — no React dependencies.
 * Pipeline: AudioBuffer → mono Float32Array → sliced → downsampled → normalized
 */

/** Mix a stereo (or multi-channel) AudioBuffer down to a single mono Float32Array. */
export function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0).slice();
  }
  const length = buffer.length;
  const mono = new Float32Array(length);
  const numChannels = buffer.numberOfChannels;
  for (let ch = 0; ch < numChannels; ch++) {
    const channel = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += channel[i];
    }
  }
  for (let i = 0; i < length; i++) {
    mono[i] /= numChannels;
  }
  return mono;
}

/** Slice a Float32Array to the given time range (in seconds). */
export function sliceRange(
  data: Float32Array,
  startSec: number,
  endSec: number,
  sampleRate: number
): Float32Array {
  const startIdx = Math.max(0, Math.floor(startSec * sampleRate));
  const endIdx = Math.min(data.length, Math.floor(endSec * sampleRate));
  return data.slice(startIdx, endIdx);
}

/**
 * Downsample audio data to numSamples points using peak absolute amplitude per window.
 * Peak (not RMS) is used to preserve the sharp transients of a heartbeat.
 */
export function downsample(data: Float32Array, numSamples: number): number[] {
  if (data.length === 0) return new Array(numSamples).fill(0);
  const windowSize = data.length / numSamples;
  const result: number[] = new Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const start = Math.floor(i * windowSize);
    const end = Math.min(data.length, Math.floor((i + 1) * windowSize));
    let peak = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(data[j]);
      if (abs > peak) peak = abs;
    }
    result[i] = peak;
  }
  return result;
}

/** Normalize an array of values to the 0–1 range. */
export function normalize(data: number[]): number[] {
  const max = Math.max(...data);
  if (max === 0) return data.map(() => 0);
  return data.map((v) => v / max);
}

/**
 * Downsample audio data to numSamples points using mean amplitude per window.
 * Mean preserves the signed waveform shape at the downsampled resolution.
 */
export function downsampleSigned(data: Float32Array, numSamples: number): number[] {
  if (data.length === 0) return new Array(numSamples).fill(0);
  const windowSize = data.length / numSamples;
  const result: number[] = new Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const start = Math.floor(i * windowSize);
    const end = Math.min(data.length, Math.floor((i + 1) * windowSize));
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += data[j];
    }
    result[i] = end > start ? sum / (end - start) : 0;
  }
  return result;
}

/** Normalize a signed array by its max absolute value → output range [-1, 1]. */
export function normalizeSigned(data: number[]): number[] {
  const maxAbs = Math.max(...data.map(Math.abs));
  if (maxAbs === 0) return data.map(() => 0);
  return data.map((v) => v / maxAbs);
}
