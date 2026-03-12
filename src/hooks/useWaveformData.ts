'use client';

import { useMemo } from 'react';
import { mixToMono, sliceRange, downsampleSigned, normalizeSigned } from '@/lib/audioUtils';

interface WaveformOptions {
  audioBuffer: AudioBuffer | null;
  rangeStart: number; // seconds
  rangeEnd: number;   // seconds
  numSamples: number;
  offset: number;     // 0–1: fraction of one window to shift the start by
}

/**
 * Derives a normalized amplitude array from the audio buffer and current settings.
 * Re-computes only when inputs change.
 */
export function useWaveformData({ audioBuffer, rangeStart, rangeEnd, numSamples, offset }: WaveformOptions): number[] {
  return useMemo(() => {
    if (!audioBuffer) return [];
    const mono = mixToMono(audioBuffer);
    const sliced = sliceRange(mono, rangeStart, rangeEnd, audioBuffer.sampleRate);
    // Shift start by a fraction of one window — different phase = different peaks/troughs
    const windowSize = Math.max(1, Math.floor(sliced.length / numSamples));
    const shift = Math.floor(offset * windowSize);
    const shifted = shift > 0 ? sliced.subarray(shift) : sliced;
    const downsampled = downsampleSigned(shifted, numSamples);
    return normalizeSigned(downsampled);
  }, [audioBuffer, rangeStart, rangeEnd, numSamples, offset]);
}
