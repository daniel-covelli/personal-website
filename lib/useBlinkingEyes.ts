'use client';

import { useEffect, useState } from 'react';

/**
 * Drives the agent face's periodic blink: (@.@) -> (-.-) for a beat, every few
 * seconds. Returns whether the eyes are currently closed. Honors reduced motion
 * by staying wide-eyed (always returns false). Each caller gets its own timers,
 * so multiple faces on the page blink independently rather than in lockstep.
 */
export function useBlinkingEyes(): boolean {
  const [eyesClosed, setEyesClosed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let openTimer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;
    const blink = () => {
      setEyesClosed(true);
      closeTimer = setTimeout(() => {
        setEyesClosed(false);
        openTimer = setTimeout(blink, 3500 + Math.random() * 4000);
      }, 150);
    };
    openTimer = setTimeout(blink, 3500 + Math.random() * 4000);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  return eyesClosed;
}
