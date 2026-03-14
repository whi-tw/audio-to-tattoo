# Heartbeat Waveform — Repo Notes

## Purpose

Browser-based tool that converts a heartbeat audio or video recording into a clean waveform image suitable for use as a tattoo template. All processing is client-side — files never leave the browser. Deployed on Vercel.

## Test assets

- `Fetal Heart Beat- Audio- 11 Weeks Pregnant.mp3` — sample doppler recording for development testing
- `WhatsApp Image 2025-11-29 at 16.33.59.jpeg` — reference photo of the finished tattoo; use to validate waveform output

## Tech stack

- **Next.js 16** (App Router, all `'use client'`)
- **React 19**
- **Tailwind v4** — configured via `@import "tailwindcss"` in globals.css, no config file needed
- **Web Audio API** — browser-native decoding (`AudioContext.decodeAudioData`); works for audio and video files (MP3, MP4, MOV, etc.)
- **SVG** — waveform rendered as React JSX, updates live as sliders move
- **Canvas API** — SVG → canvas → PNG for export

## Architecture

All state lives in `src/app/page.tsx`. Data flows down via props; events bubble up via callbacks. No external state library.

```
FilePicker → useAudioDecoder → AudioBuffer + audioCtx
AudioBuffer + range + controls → useWaveformData → amplitudes[]
amplitudes[] → WaveformPreview (SVG) + ExportButtons
```

## Key files

| File | Purpose |
|------|---------|
| `src/lib/audioUtils.ts` | Pure audio processing: mixToMono, sliceRange, downsample (peak), downsampleSigned (mean), normalize, normalizeSigned |
| `src/lib/svgPath.ts` | SVG path generation: buildWaveformPath (open signed line), buildSymmetricPath (closed blob for overview), buildSVGString (export) |
| `src/lib/exportUtils.ts` | downloadSVG and downloadPNG (via canvas at 2× scale) |
| `src/hooks/useAudioDecoder.ts` | FileReader → AudioContext → AudioBuffer; exposes audioCtx ref for playback |
| `src/hooks/useWaveformData.ts` | useMemo wrapper: AudioBuffer → signed amplitudes[] with offset support |
| `src/components/RangeSelector.tsx` | Zoomable/pannable waveform overview with click-drag selection, zoom buttons |
| `src/components/PlayButton.tsx` | Play/stop selected range via AudioBufferSourceNode; spacebar shortcut |
| `src/components/WaveformPreview.tsx` | Renders the SVG inline, horizontally scrollable |
| `src/components/Instructions.tsx` | Help modal (? button in header) |
| `src/app/page.tsx` | Orchestrator: all shared state, wires components |

## Audio pipeline

```
File (audio or video) → FileReader.readAsArrayBuffer → AudioContext.decodeAudioData → AudioBuffer
AudioBuffer → mixToMono → Float32Array (mono)
Float32Array → sliceRange (start/end seconds) → Float32Array (selected range)
Float32Array → subarray(shift) → phase-shifted slice (offset control)
Float32Array → downsampleSigned (mean per window) → number[]
number[] → normalizeSigned (÷ max abs) → amplitudes[] in [-1, 1]
```

The overview in RangeSelector still uses `downsample` (peak) + `normalize` [0,1] for the symmetric blob thumbnail.

## SVG path algorithm

The main waveform is an **open single-line stroke** tracing signed amplitude values:
- `y = centerY − amplitude × halfHeight` (positive → above centre, negative → below)
- `smoothing=0`: L commands (sharp zigzag)
- `smoothing>0`: C (cubic bezier) commands with horizontal control points offset by `step × smoothing × 0.5`
- `fill="none"`, stroke only

SVG width and height are both user-controlled (defaults: 840×200px).

## Controls

| Control | Effect |
|---------|--------|
| Samples | Number of windows / peaks and valleys |
| Width | Export image width in px |
| Height | Export image height in px; also changes preview box size |
| Stroke width | Line thickness |
| Smoothing | 0 = sharp, 1 = smooth bezier curves |
| Offset | Phase-shifts window boundaries (0–1 = one full window cycle); changes shape without affecting truthfulness |

## RangeSelector interactions

- **Drag** empty area → draw new selection
- **Drag** inside selection → move it
- **Drag** blue handles → resize start/end
- **Click** outside selection → deselect
- **Scroll / pinch** → zoom centred on cursor
- **Horizontal swipe / shift+scroll** → pan
- **+/−/Reset buttons** → step zoom or reset to full view
- **Spacebar** → play/stop selection

## Running locally

```bash
npm run dev
```

Open http://localhost:3000, load the test MP3.

## Deploying

Push to a GitHub repo and connect to Vercel. Zero config needed — Vercel auto-detects Next.js.

# Includes

@AGENTS.md
