"use client";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue?: string;
  onChange: (value: number) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <label className="text-sm text-gray-700">{label}</label>
        <span className="text-sm font-mono text-gray-900">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-gray-800"
      />
    </div>
  );
}

export interface Controls {
  numSamples: number;
  imageWidth: number;
  imageHeight: number;
  strokeWidth: number;
  smoothing: number;
  offset: number;
}

interface ControlsPanelProps {
  controls: Controls;
  onChange: (controls: Controls) => void;
}

export function ControlsPanel({ controls, onChange }: ControlsPanelProps) {
  const update = (key: keyof Controls) => (value: number) => {
    onChange({ ...controls, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Waveform settings
      </label>
      <Slider
        label="Samples"
        value={controls.numSamples}
        min={50}
        max={800}
        step={1}
        onChange={update("numSamples")}
      />
      <Slider
        label="Width"
        value={controls.imageWidth}
        min={500}
        max={4000}
        step={10}
        displayValue={`${controls.imageWidth}px`}
        onChange={update("imageWidth")}
      />
      <Slider
        label="Height"
        value={controls.imageHeight}
        min={50}
        max={800}
        step={10}
        displayValue={`${controls.imageHeight}px`}
        onChange={update("imageHeight")}
      />
      <Slider
        label="Stroke width"
        value={controls.strokeWidth}
        min={0}
        max={20}
        step={0.01}
        onChange={update("strokeWidth")}
      />
      <Slider
        label="Smoothing"
        value={controls.smoothing}
        min={0}
        max={1}
        step={0.01}
        onChange={update("smoothing")}
      />
      <Slider
        label="Offset"
        value={controls.offset}
        min={0}
        max={1}
        step={0.001}
        onChange={update("offset")}
      />
    </div>
  );
}
