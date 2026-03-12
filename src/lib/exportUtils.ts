/** Trigger a browser file download from a Blob. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download the waveform as an SVG file. */
export function downloadSVG(svgString: string, filename = "waveform.svg"): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  triggerDownload(blob, filename);
}

/**
 * Download the waveform as a PNG file.
 * Renders the SVG onto a canvas at 2× scale for retina quality.
 */
export function downloadPNG(
  svgString: string,
  width: number,
  height: number,
  filename = "waveform.png"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        triggerDownload(pngBlob, filename);
        resolve();
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG as image"));
    };

    img.src = url;
  });
}
