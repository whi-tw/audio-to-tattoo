/**
 * Pure SVG path generation for waveform rendering.
 * Produces an open stroke path tracing the signed waveform shape.
 */

const SVG_HEIGHT = 200;
const PADDING = 0.9; // use 90% of height so waveform has a little breathing room

/**
 * Build an open SVG path string representing the signed waveform as a single line.
 *
 * @param amplitudes  Signed amplitude values ([-1, 1]), one per sample
 * @param width       Total SVG width in pixels
 * @param smoothing   0 = sharp polyline, >0 = cubic bezier
 * @param height      Total SVG height in pixels (defaults to SVG_HEIGHT)
 */
export function buildWaveformPath(
  amplitudes: number[],
  width: number,
  smoothing: number,
  height: number = SVG_HEIGHT
): string {
  const n = amplitudes.length;
  if (n === 0) return "";

  const centerY = height / 2;
  const halfH = (height / 2) * PADDING;

  const xAt = (i: number) => (n === 1 ? width / 2 : (i / (n - 1)) * width);
  const yAt = (i: number) => centerY - amplitudes[i] * halfH;

  if (smoothing === 0) {
    const parts: string[] = [`M ${xAt(0)},${yAt(0)}`];
    for (let i = 1; i < n; i++) {
      parts.push(`L ${xAt(i)},${yAt(i)}`);
    }
    return parts.join(" ");
  }

  // Smooth — cubic bezier with horizontal control points
  const step = n > 1 ? width / (n - 1) : width;
  const cp = step * Math.min(smoothing, 1) * 0.5;

  const parts: string[] = [`M ${xAt(0)},${yAt(0)}`];
  for (let i = 1; i < n; i++) {
    const x0 = xAt(i - 1);
    const x1 = xAt(i);
    const y0 = yAt(i - 1);
    const y1 = yAt(i);
    parts.push(`C ${x0 + cp},${y0} ${x1 - cp},${y1} ${x1},${y1}`);
  }
  return parts.join(" ");
}

/**
 * Build a closed symmetric path for overview/thumbnail use.
 * Takes unsigned [0,1] amplitudes and mirrors top/bottom around the centre.
 */
export function buildSymmetricPath(
  amplitudes: number[],
  width: number,
  smoothing: number
): string {
  const n = amplitudes.length;
  if (n === 0) return "";

  const centerY = SVG_HEIGHT / 2;
  const halfH = (SVG_HEIGHT / 2) * PADDING;

  const xAt = (i: number) => (n === 1 ? width / 2 : (i / (n - 1)) * width);
  const topAt = (i: number) => centerY - amplitudes[i] * halfH;
  const botAt = (i: number) => centerY + amplitudes[i] * halfH;

  if (smoothing === 0) {
    const parts: string[] = [`M ${xAt(0)},${topAt(0)}`];
    for (let i = 1; i < n; i++) parts.push(`L ${xAt(i)},${topAt(i)}`);
    for (let i = n - 1; i >= 0; i--) parts.push(`L ${xAt(i)},${botAt(i)}`);
    parts.push("Z");
    return parts.join(" ");
  }

  const step = n > 1 ? width / (n - 1) : width;
  const cp = step * Math.min(smoothing, 1) * 0.5;

  const topParts: string[] = [`M ${xAt(0)},${topAt(0)}`];
  for (let i = 1; i < n; i++) {
    topParts.push(`C ${xAt(i - 1) + cp},${topAt(i - 1)} ${xAt(i) - cp},${topAt(i)} ${xAt(i)},${topAt(i)}`);
  }
  const botParts: string[] = [];
  for (let i = n - 1; i >= 1; i--) {
    botParts.push(`C ${xAt(i) - cp},${botAt(i)} ${xAt(i - 1) + cp},${botAt(i - 1)} ${xAt(i - 1)},${botAt(i - 1)}`);
  }
  botParts.push("Z");
  return [...topParts, ...botParts].join(" ");
}

/** Build a full SVG string suitable for file export. */
export function buildSVGString(
  amplitudes: number[],
  width: number,
  smoothing: number,
  strokeWidth: number,
  height: number = SVG_HEIGHT
): string {
  const path = buildWaveformPath(amplitudes, width, smoothing, height);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  <path d="${path}" fill="none" stroke="black" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
}

export { SVG_HEIGHT };
