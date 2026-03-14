'use client';

import { useState, useRef, useCallback } from 'react';

interface AudioDecoderState {
  audioBuffer: AudioBuffer | null;
  loadingStatus: string | null;
  error: string | null;
  fileName: string | null;
}

interface AudioDecoderResult extends AudioDecoderState {
  isLoading: boolean;
  decode: (file: File) => void;
  audioCtx: AudioContext | null;
}

async function extractAudioViaFFmpeg(
  file: File,
  onStatus: (msg: string) => void
): Promise<ArrayBuffer> {
  onStatus('Loading video decoder…');

  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  onStatus('Extracting audio…');

  const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec(['-i', inputName, '-vn', '-ac', '1', '-ar', '44100', '-f', 'wav', 'output.wav']);

  const data = await ffmpeg.readFile('output.wav');
  const uint8 = data as Uint8Array;
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

export function useAudioDecoder(): AudioDecoderResult {
  const [state, setState] = useState<AudioDecoderState>({
    audioBuffer: null,
    loadingStatus: null,
    error: null,
    fileName: null,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const decode = useCallback((file: File) => {
    setState({ audioBuffer: null, loadingStatus: 'Decoding audio…', error: null, fileName: file.name });

    const isVideo = file.type.startsWith('video/');

    const run = async () => {
      try {
        let arrayBuffer: ArrayBuffer;

        if (isVideo) {
          arrayBuffer = await extractAudioViaFFmpeg(file, (msg) =>
            setState((s) => ({ ...s, loadingStatus: msg }))
          );
        } else {
          arrayBuffer = await file.arrayBuffer();
        }

        setState((s) => ({ ...s, loadingStatus: 'Decoding audio…' }));

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContext();
        }
        const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        setState({ audioBuffer, loadingStatus: null, error: null, fileName: file.name });
      } catch (err) {
        setState({
          audioBuffer: null,
          loadingStatus: null,
          error: err instanceof Error ? err.message : 'Failed to decode audio',
          fileName: null,
        });
      }
    };

    run();
  }, []);

  return {
    ...state,
    isLoading: state.loadingStatus !== null,
    decode,
    audioCtx: audioCtxRef.current,
  };
}
