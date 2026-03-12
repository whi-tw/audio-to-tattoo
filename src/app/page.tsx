"use client";

import { Controls, ControlsPanel } from "@/components/ControlsPanel";
import { ExportButtons } from "@/components/ExportButtons";
import { FilePicker } from "@/components/FilePicker";
import { RangeSelector } from "@/components/RangeSelector";
import { WaveformPreview } from "@/components/WaveformPreview";
import { useAudioDecoder } from "@/hooks/useAudioDecoder";
import { useWaveformData } from "@/hooks/useWaveformData";
import { useState } from "react";
import { Instructions } from "@/components/Instructions";

const DEFAULT_CONTROLS: Controls = {
  numSamples: 200,
  imageWidth: 840,
  imageHeight: 200,
  strokeWidth: 2,
  smoothing: 0,
  offset: 0,
};

export default function Home() {
  const { audioBuffer, isLoading, error, fileName, decode, audioCtx } =
    useAudioDecoder();

  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleFileSelected = (file: File) => {
    setRangeStart(0);
    setRangeEnd(0);
    decode(file);
  };

  // When rangeEnd is 0 (initial state), treat it as the full audio duration
  const effectiveRangeEnd =
    audioBuffer && rangeEnd === 0 ? audioBuffer.duration : rangeEnd;

  const amplitudes = useWaveformData({
    audioBuffer,
    rangeStart,
    rangeEnd: effectiveRangeEnd,
    numSamples: controls.numSamples,
    offset: controls.offset,
  });

  const handleRangeChange = (start: number, end: number) => {
    setRangeStart(start);
    setRangeEnd(end);
  };

  return (
    <main className="min-h-screen bg-white">
      {showInstructions && <Instructions onClose={() => setShowInstructions(false)} />}
      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Heartbeat Waveform
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Load an audio file, select a range, adjust the waveform, then export.
            </p>
          </div>
          <button
            onClick={() => setShowInstructions(true)}
            className="mt-1 w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-500 text-sm font-medium flex items-center justify-center transition-colors"
            title="How to use"
          >?</button>
        </div>

        <FilePicker
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
          error={error}
          fileName={fileName}
          audioDuration={audioBuffer?.duration ?? null}
        />

        {audioBuffer && audioCtx && (
          <RangeSelector
            audioBuffer={audioBuffer}
            audioCtx={audioCtx}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onRangeChange={handleRangeChange}
          />
        )}

        <ControlsPanel controls={controls} onChange={setControls} />

        <WaveformPreview
          amplitudes={amplitudes}
          width={controls.imageWidth}
          height={controls.imageHeight}
          strokeWidth={controls.strokeWidth}
          smoothing={controls.smoothing}
        />

        <ExportButtons
          amplitudes={amplitudes}
          width={controls.imageWidth}
          height={controls.imageHeight}
          strokeWidth={controls.strokeWidth}
          smoothing={controls.smoothing}
        />
      </div>
    </main>
  );
}
