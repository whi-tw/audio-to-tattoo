'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { mixToMono, sliceRange, downsample, normalize } from '@/lib/audioUtils';
import { buildSymmetricPath, SVG_HEIGHT } from '@/lib/svgPath';
import { PlayButton } from '@/components/PlayButton';

const OVERVIEW_SAMPLES = 300;
const OVERVIEW_WIDTH = 800;
const MIN_SPAN_SEC = 0.05;
const DESELECT_PX_THRESHOLD = 4;
const HANDLE_HIT_PX = 10; // px radius for grabbing a handle edge
const ZOOM_STEP = 2; // factor for button zoom

interface RangeSelectorProps {
  audioBuffer: AudioBuffer;
  audioCtx: AudioContext;
  rangeStart: number;
  rangeEnd: number;
  onRangeChange: (start: number, end: number) => void;
}

export function RangeSelector({ audioBuffer, audioCtx, rangeStart, rangeEnd, onRangeChange }: RangeSelectorProps) {
  const duration = audioBuffer.duration;
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom window — what slice of the audio is visible
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(duration);

  // Reset view when a new file is loaded
  useEffect(() => {
    setViewStart(0);
    setViewEnd(duration);
  }, [audioBuffer, duration]);

  const [cursor, setCursor] = useState<string>('crosshair');

  // Waveform for the current view window
  const overviewAmplitudes = useMemo(() => {
    const mono = mixToMono(audioBuffer);
    const sliced = sliceRange(mono, viewStart, viewEnd, audioBuffer.sampleRate);
    const downsampled = downsample(sliced, OVERVIEW_SAMPLES);
    return normalize(downsampled);
  }, [audioBuffer, viewStart, viewEnd]);

  const overviewPath = buildSymmetricPath(overviewAmplitudes, OVERVIEW_WIDTH, 0.3);

  // --- Coordinate helpers ---

  const xToTime = useCallback((clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return viewStart;
    const frac = (clientX - rect.left) / rect.width;
    return viewStart + frac * (viewEnd - viewStart);
  }, [viewStart, viewEnd]);

  // Time → 0–100% across the container (for positioning)
  const timeToPct = (t: number) => ((t - viewStart) / (viewEnd - viewStart)) * 100;

  const clampToView = (t: number) => Math.max(viewStart, Math.min(viewEnd, t));

  // --- Zoom ---

  const applyZoom = useCallback((factor: number, centreTime: number) => {
    setViewStart(prev => {
      const vs = centreTime - (centreTime - prev) * factor;
      return Math.max(0, vs);
    });
    setViewEnd(prev => {
      const ve = centreTime + (prev - centreTime) * factor;
      return Math.min(duration, ve);
    });
  }, [duration]);

  // Attach wheel as non-passive so preventDefault() actually blocks browser zoom/scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const span = viewEnd - viewStart;

      // Horizontal swipe (trackpad) or shift+scroll → pan
      if (e.deltaX !== 0 || e.shiftKey) {
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        const panSec = (delta / el.getBoundingClientRect().width) * span;
        const newStart = Math.max(0, Math.min(duration - span, viewStart + panSec));
        setViewStart(newStart);
        setViewEnd(newStart + span);
        return;
      }

      // Vertical scroll / pinch → zoom
      const sensitivity = e.ctrlKey ? 0.01 : 0.001;
      const factor = Math.exp(e.deltaY * sensitivity);
      const rect = el.getBoundingClientRect();
      const frac = (e.clientX - rect.left) / rect.width;
      const centreTime = viewStart + frac * span;
      const newSpan = span * factor;
      if (newSpan < MIN_SPAN_SEC || newSpan > duration) return;
      applyZoom(factor, centreTime);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [viewStart, viewEnd, duration, applyZoom]);

  const zoomIn = () => {
    const mid = (rangeStart + rangeEnd) / 2;
    const centre = rangeStart < rangeEnd ? mid : (viewStart + viewEnd) / 2;
    const span = viewEnd - viewStart;
    const newSpan = span / ZOOM_STEP;
    if (newSpan < MIN_SPAN_SEC) return;
    const vs = Math.max(0, centre - newSpan / 2);
    const ve = Math.min(duration, centre + newSpan / 2);
    setViewStart(vs);
    setViewEnd(ve);
  };

  const zoomOut = () => {
    const centre = (viewStart + viewEnd) / 2;
    const span = viewEnd - viewStart;
    const newSpan = Math.min(duration, span * ZOOM_STEP);
    const vs = Math.max(0, centre - newSpan / 2);
    const ve = Math.min(duration, centre + newSpan / 2);
    setViewStart(vs);
    setViewEnd(ve);
  };

  const resetZoom = () => {
    setViewStart(0);
    setViewEnd(duration);
  };

  // --- Pointer interaction ---

  type DragMode = 'select' | 'move' | 'resize-start' | 'resize-end';

  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    anchor: number;         // time at pointerdown
    initRangeStart: number;
    initRangeEnd: number;
  } | null>(null);

  /** Pixel x of a time value within the container. */
  const timeToContainerX = useCallback((t: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return ((t - viewStart) / (viewEnd - viewStart)) * rect.width;
  }, [viewStart, viewEnd]);

  /** Which drag mode applies to a mouse clientX, given current selection. */
  const hitMode = useCallback((clientX: number): DragMode => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 'select';
    const mouseX = clientX - rect.left;
    if (rangeEnd > rangeStart) {
      const startPx = timeToContainerX(rangeStart);
      const endPx   = timeToContainerX(rangeEnd);
      if (Math.abs(mouseX - startPx) < HANDLE_HIT_PX) return 'resize-start';
      if (Math.abs(mouseX - endPx)   < HANDLE_HIT_PX) return 'resize-end';
      if (mouseX > startPx && mouseX < endPx)          return 'move';
    }
    return 'select';
  }, [rangeStart, rangeEnd, timeToContainerX]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const mode = hitMode(e.clientX);
    dragRef.current = {
      mode,
      startX: e.clientX,
      anchor: xToTime(e.clientX),
      initRangeStart: rangeStart,
      initRangeEnd: rangeEnd,
    };
  }, [hitMode, xToTime, rangeStart, rangeEnd]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const t = xToTime(e.clientX);

    // Update cursor hint when idle
    if (!drag) {
      const mode = hitMode(e.clientX);
      if (mode === 'resize-start' || mode === 'resize-end') setCursor('ew-resize');
      else if (mode === 'move') setCursor('grab');
      else setCursor('crosshair');
      return;
    }

    if (drag.mode === 'select') {
      const lo = clampToView(Math.min(drag.anchor, t));
      const hi = clampToView(Math.max(drag.anchor, t));
      onRangeChange(lo, hi);
    } else if (drag.mode === 'resize-start') {
      const newStart = Math.min(clampToView(t), drag.initRangeEnd - MIN_SPAN_SEC);
      onRangeChange(newStart, drag.initRangeEnd);
    } else if (drag.mode === 'resize-end') {
      const newEnd = Math.max(clampToView(t), drag.initRangeStart + MIN_SPAN_SEC);
      onRangeChange(drag.initRangeStart, newEnd);
    } else {
      // move: shift whole selection by delta from anchor
      const delta = t - drag.anchor;
      const span = drag.initRangeEnd - drag.initRangeStart;
      const newStart = Math.max(viewStart, Math.min(viewEnd - span, drag.initRangeStart + delta));
      onRangeChange(newStart, newStart + span);
    }
  }, [xToTime, hitMode, viewStart, viewEnd, onRangeChange, clampToView]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    const draggedPx = Math.abs(e.clientX - drag.startX);
    if (drag.mode === 'select' && draggedPx < DESELECT_PX_THRESHOLD) {
      // Click with no drag → clear selection
      onRangeChange(0, 0);
    }
  }, [onRangeChange]);

  // --- SVG overlay positions ---
  const startPct = timeToPct(rangeStart);
  const endPct = timeToPct(rangeEnd);
  const startSvgX = (startPct / 100) * OVERVIEW_WIDTH;
  const endSvgX = (endPct / 100) * OVERVIEW_WIDTH;

  // Clamp for rendering (handles may be out of view while zoomed)
  const visibleStart = Math.max(0, startPct);
  const visibleEnd = Math.min(100, endPct);
  const hasSelection = rangeEnd > rangeStart;

  const fmt = (s: number) => s.toFixed(3) + 's';
  const fmtView = (s: number) => s.toFixed(2) + 's';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Selection
        </label>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomIn}
            title="Zoom in"
            className="w-6 h-6 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center justify-center leading-none"
          >+</button>
          <button
            onClick={zoomOut}
            title="Zoom out"
            className="w-6 h-6 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center justify-center leading-none"
          >−</button>
          <button
            onClick={resetZoom}
            title="Reset zoom"
            className="px-2 h-6 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >Reset</button>
        </div>
      </div>

      {/* Interactive waveform */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded bg-white border border-gray-200 select-none"
        style={{ height: 80, cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg
          viewBox={`0 0 ${OVERVIEW_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          {/* Waveform */}
          <rect width={OVERVIEW_WIDTH} height={SVG_HEIGHT} fill="white" />
          <path d={overviewPath} fill="#374151" stroke="#374151" strokeWidth={1} />

          {/* Unselected dim overlays */}
          {hasSelection && visibleStart > 0 && (
            <rect x={0} y={0} width={(visibleStart / 100) * OVERVIEW_WIDTH} height={SVG_HEIGHT} fill="white" opacity={0.65} />
          )}
          {hasSelection && visibleEnd < 100 && (
            <rect
              x={(visibleEnd / 100) * OVERVIEW_WIDTH} y={0}
              width={((100 - visibleEnd) / 100) * OVERVIEW_WIDTH} height={SVG_HEIGHT}
              fill="white" opacity={0.65}
            />
          )}

          {/* Selection boundary lines + handle ticks */}
          {hasSelection && startPct >= 0 && startPct <= 100 && (
            <>
              <line x1={startSvgX} y1={0} x2={startSvgX} y2={SVG_HEIGHT} stroke="#1d4ed8" strokeWidth={2} />
              <polygon points={`${startSvgX - 6},0 ${startSvgX + 6},0 ${startSvgX},12`} fill="#1d4ed8" />
            </>
          )}
          {hasSelection && endPct >= 0 && endPct <= 100 && (
            <>
              <line x1={endSvgX} y1={0} x2={endSvgX} y2={SVG_HEIGHT} stroke="#1d4ed8" strokeWidth={2} />
              <polygon points={`${endSvgX - 6},0 ${endSvgX + 6},0 ${endSvgX},12`} fill="#1d4ed8" />
            </>
          )}
        </svg>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {hasSelection
            ? <>{fmt(rangeStart)} – {fmt(rangeEnd)} &nbsp;·&nbsp; <strong>{fmt(rangeEnd - rangeStart)}</strong> selected</>
            : 'Drag to select a region'
          }
          {' '}&nbsp;·&nbsp; view: {fmtView(viewStart)}–{fmtView(viewEnd)}
        </p>
        {hasSelection && (
          <PlayButton audioBuffer={audioBuffer} audioCtx={audioCtx} rangeStart={rangeStart} rangeEnd={rangeEnd} />
        )}
      </div>
    </div>
  );
}
