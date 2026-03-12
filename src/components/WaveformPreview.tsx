'use client';

import { useState, useEffect } from 'react';
import { buildWaveformPath } from '@/lib/svgPath';

interface WaveformPreviewProps {
  amplitudes: number[];
  width: number;
  height: number;
  strokeWidth: number;
  smoothing: number;
}

export function WaveformPreview({ amplitudes, width, height, strokeWidth, smoothing }: WaveformPreviewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  if (amplitudes.length === 0) {
    return (
      <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
        <p className="text-gray-400 text-sm">Load an audio file to see the waveform</p>
      </div>
    );
  }

  const path = buildWaveformPath(amplitudes, width, smoothing, height);

  const svgContent = (
    <>
      <rect width={width} height={height} fill="white" />
      <path
        d={path}
        fill="none"
        stroke="black"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Preview
        </label>
        <div
          className="overflow-auto border border-gray-200 rounded bg-white cursor-zoom-in"
          style={{ height: 302 }}
          onClick={() => setModalOpen(true)}
          title="Click to view full size"
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', minWidth: width }}
          >
            {svgContent}
          </svg>
        </div>
        <p className="text-xs text-gray-500">{amplitudes.length} samples · {width}×{height}px · click to enlarge</p>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setModalOpen(false)}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            style={{ display: 'block', maxWidth: '95vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {svgContent}
          </svg>
        </div>
      )}
    </>
  );
}
