'use client';

import { useState, useRef, useEffect } from 'react';

interface PlayButtonProps {
  audioBuffer: AudioBuffer;
  audioCtx: AudioContext;
  rangeStart: number;
  rangeEnd: number;
}

export function PlayButton({ audioBuffer, audioCtx, rangeStart, rangeEnd }: PlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const toggle = () => {
    if (isPlaying) {
      sourceRef.current?.stop();
      sourceRef.current = null;
      setIsPlaying(false);
    } else {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
      source.start(0, rangeStart, rangeEnd - rangeStart);
      sourceRef.current = source;
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
    >
      <span className="text-base leading-none">{isPlaying ? '■' : '▶'}</span>
      <span>{isPlaying ? 'Stop' : 'Play selection'}</span>
    </button>
  );
}
