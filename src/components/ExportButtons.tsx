'use client';

import { useState } from 'react';
import { buildSVGString } from '@/lib/svgPath';
import { downloadSVG, downloadPNG } from '@/lib/exportUtils';

interface ExportButtonsProps {
  amplitudes: number[];
  width: number;
  height: number;
  strokeWidth: number;
  smoothing: number;
}

export function ExportButtons({ amplitudes, width, height, strokeWidth, smoothing }: ExportButtonsProps) {
  const [pngLoading, setPngLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = amplitudes.length === 0;

  const getSVGString = () => buildSVGString(amplitudes, width, smoothing, strokeWidth, height);

  const handleSVG = () => {
    setError(null);
    downloadSVG(getSVGString());
  };

  const handlePNG = async () => {
    setError(null);
    setPngLoading(true);
    try {
      await downloadPNG(getSVGString(), width, height);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG export failed');
    } finally {
      setPngLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Export
      </label>
      <div className="flex gap-3">
        <button
          onClick={handleSVG}
          disabled={disabled}
          className="flex-1 py-2 px-4 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Download SVG
        </button>
        <button
          onClick={handlePNG}
          disabled={disabled || pngLoading}
          className="flex-1 py-2 px-4 border border-gray-800 text-gray-800 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {pngLoading ? 'Rendering…' : 'Download PNG'}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
