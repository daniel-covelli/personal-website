'use client';

import { useRef, useState } from 'react';
import { useBlinkingEyes } from './useBlinkingEyes';

/**
 * The agent's little ASCII face, sharing one set of eyes between two motions:
 * an ambient blink ((@.@) -> (-.-)) and a quick hover wink ((@.@) -> (@.-)).
 * Because both drive the same eyes, they're kept off each other's toes — after
 * either fires, the other holds off for a beat so they never land at once. The
 * wink takes precedence while it's showing.
 *
 * Returns the current face string plus a `wink` handler to wire to onMouseEnter.
 */
export function useAgentFace(): { face: string; wink: () => void } {
  const [winking, setWinking] = useState(false);
  const winkTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastBlinkAt = useRef(0);
  const lastWinkAt = useRef(0);

  const COOLDOWN = 1500;
  const eyesClosed = useBlinkingEyes({
    shouldBlink: () => Date.now() - lastWinkAt.current > COOLDOWN,
    onBlink: () => {
      lastBlinkAt.current = Date.now();
    },
  });

  // Fire a quick wink — one beat, then back to normal even while the pointer
  // lingers. Skipped if the face just blinked.
  const wink = () => {
    if (Date.now() - lastBlinkAt.current < COOLDOWN) return;
    lastWinkAt.current = Date.now();
    setWinking(true);
    clearTimeout(winkTimer.current);
    winkTimer.current = setTimeout(() => setWinking(false), 400);
  };

  const face = winking ? '(@.-)' : eyesClosed ? '(-.-)' : '(@.@)';

  return { face, wink };
}
