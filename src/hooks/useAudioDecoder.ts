'use client';

import { useState, useRef, useCallback } from 'react';

interface AudioDecoderState {
  audioBuffer: AudioBuffer | null;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
}

interface AudioDecoderResult extends AudioDecoderState {
  decode: (file: File) => void;
  audioCtx: AudioContext | null;
}

export function useAudioDecoder(): AudioDecoderResult {
  const [state, setState] = useState<AudioDecoderState>({
    audioBuffer: null,
    isLoading: false,
    error: null,
    fileName: null,
  });

  // Reuse AudioContext across decodes to avoid the browser limit on context creation
  const audioCtxRef = useRef<AudioContext | null>(null);

  const decode = useCallback((file: File) => {
    setState({ audioBuffer: null, isLoading: true, error: null, fileName: file.name });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContext();
        }
        const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        setState({ audioBuffer, isLoading: false, error: null, fileName: file.name });
      } catch (err) {
        setState({
          audioBuffer: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to decode audio',
          fileName: null,
        });
      }
    };
    reader.onerror = () => {
      setState({
        audioBuffer: null,
        isLoading: false,
        error: 'Failed to read file',
        fileName: null,
      });
    };
    reader.readAsArrayBuffer(file);
  }, []);

  return { ...state, decode, audioCtx: audioCtxRef.current };
}
