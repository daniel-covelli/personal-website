'use client';

import { useEffect, useRef, useState } from 'react';

interface BlinkOptions {
  /**
   * Consulted right before each blink. Return false to skip this one and retry
   * shortly — lets a caller postpone the ambient blink after a related bit of
   * motion (e.g. a hover wink) so the two don't land on top of each other.
   */
  shouldBlink?: () => boolean;
  /** Fired the instant a blink actually starts, so callers can record when. */
  onBlink?: () => void;
}

/**
 * Drives the agent face's periodic blink: (@.@) -> (-.-) for a beat, every few
 * seconds. Returns whether the eyes are currently closed. Honors reduced motion
 * by staying wide-eyed (always returns false). Each caller gets its own timers,
 * so multiple faces on the page blink independently rather than in lockstep.
 */
export function useBlinkingEyes(options?: BlinkOptions): boolean {
  const [eyesClosed, setEyesClosed] = useState(false);
  // Keep the latest callbacks in a ref so passing fresh closures each render
  // doesn't re-run the effect and reset the blink timers.
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let openTimer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;
    const blink = () => {
      if (optsRef.current?.shouldBlink?.() === false) {
        openTimer = setTimeout(blink, 1500);
        return;
      }
      optsRef.current?.onBlink?.();
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
