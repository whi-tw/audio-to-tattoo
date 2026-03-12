'use client';

import { buildWaveformPath } from '@/lib/svgPath';

interface WaveformPreviewProps {
  amplitudes: number[];
  width: number;
  height: number;
  strokeWidth: number;
  smoothing: number;
}

export function WaveformPreview({ amplitudes, width, height, strokeWidth, smoothing }: WaveformPreviewProps) {
  if (amplitudes.length === 0) {
    return (
      <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
        <p className="text-gray-400 text-sm">Load an audio file to see the waveform</p>
      </div>
    );
  }

  const path = buildWaveformPath(amplitudes, width, smoothing, height);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Preview
      </label>
      <div className="overflow-x-auto border border-gray-200 rounded bg-white">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', minWidth: width }}
        >
          <rect width={width} height={height} fill="white" />
          <path
            d={path}
            fill="none"
            stroke="black"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-xs text-gray-500">{amplitudes.length} samples · {width}×{height}px</p>
    </div>
  );
}
