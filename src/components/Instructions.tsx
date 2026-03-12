'use client';

import { useEffect } from 'react';

interface InstructionsProps {
  onClose: () => void;
}

export function Instructions({ onClose }: InstructionsProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">How to use</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Close"
          >×</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6 text-sm text-gray-700">

          {/* Selecting a region */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Selecting a region</h3>
            <ul className="flex flex-col gap-1.5 list-none">
              <li><Kbd>drag</Kbd> on the waveform to draw a new selection</li>
              <li><Kbd>drag</Kbd> inside the selection to slide it left or right</li>
              <li><Kbd>drag</Kbd> the blue handles to expand or shrink the selection</li>
              <li><Kbd>click</Kbd> outside the selection to clear it</li>
              <li><Kbd>space</Kbd> to play or stop the selected region</li>
            </ul>
          </section>

          {/* Zoom & pan */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Zooming & panning</h3>
            <ul className="flex flex-col gap-1.5">
              <li><Kbd>scroll</Kbd> or <Kbd>pinch</Kbd> to zoom in and out, centred on the cursor</li>
              <li><Kbd>horizontal swipe</Kbd> or <Kbd>shift+scroll</Kbd> to pan left and right</li>
              <li>Use the <Kbd>+</Kbd> <Kbd>−</Kbd> buttons to zoom in steps, centred on your selection</li>
              <li><Kbd>Reset</Kbd> to zoom back out to the full recording</li>
            </ul>
          </section>

          {/* Settings */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Waveform settings</h3>
            <dl className="flex flex-col gap-3">
              <Row term="Samples">
                The number of peaks and valleys in the waveform. More samples = more
                detail and a busier shape. Fewer = simpler and chunkier. Try anywhere
                from 50 to 400 to see what suits the recording.
              </Row>
              <Row term="Width">
                The pixel width of the exported image. Doesn't affect the shape —
                just how large the file is.
              </Row>
              <Row term="Height">
                The pixel height of the exported image. Also changes how tall the
                preview looks. Taller gives the waveform more room to breathe;
                shorter makes it more compact.
              </Row>
              <Row term="Stroke width">
                How thick the line is. Thin lines look delicate; thicker lines are
                bolder and hold up better at small print sizes.
              </Row>
              <Row term="Smoothing">
                At <strong>0</strong> the line is sharp and angular — every peak is a
                point. At <strong>1</strong> the corners are rounded into smooth
                curves.
              </Row>
              <Row term="Offset">
                A "vibes" setting. The waveform is built by averaging small windows of
                the recording. Offset shifts where each window starts — which changes
                which part of the sound gets emphasised.{' '}
                <strong>Every position on this slider is a completely genuine
                representation of the recording.</strong> The heartbeat is real at
                every value. This just lets you find the shape that looks most
                beautiful to you.
              </Row>
            </dl>
          </section>

          {/* Preview & export */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Preview & export</h3>
            <ul className="flex flex-col gap-1.5">
              <li><Kbd>click</Kbd> the preview to open it full-size — useful for checking detail without scrolling</li>
              <li><Kbd>click</Kbd> outside or press <Kbd>Escape</Kbd> to close the full-size view</li>
              <li>Use <strong>Download SVG</strong> for a scalable vector file (maybe useful for a tattoo artist?)</li>
              <li>Use <strong>Download PNG</strong> for a high-resolution raster image</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
      {children}
    </kbd>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-gray-900 mb-0.5">{term}</dt>
      <dd className="text-gray-600 leading-relaxed">{children}</dd>
    </div>
  );
}
