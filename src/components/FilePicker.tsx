'use client';

import { useRef } from 'react';

interface FilePickerProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
  audioDuration: number | null;
}

export function FilePicker({ onFileSelected, isLoading, error, fileName, audioDuration }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Audio / video file
      </label>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={handleChange}
        />
        {isLoading ? (
          <p className="text-gray-500">Decoding audio…</p>
        ) : fileName ? (
          <div>
            <p className="font-medium text-gray-800 truncate">{fileName}</p>
            {audioDuration !== null && (
              <p className="text-sm text-gray-500 mt-1">{formatDuration(audioDuration)}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Click to select an audio or video file</p>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
