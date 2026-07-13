'use client';

import { useEffect, useState } from 'react';

const FRAMES = [' ', '.', 'o', 'O', '@', '*'];
const REST = '@';
const INTERVAL_MS = 140;

/**
 * Bloom — the assistant's "thinking" mark. A dot inflates to a burst
 * (` . o O @ *`) then restarts, drawn in the Nebula violet so it reads
 * clearly in both light and dark. A pure-ASCII glyph, so it needs no icon
 * asset and doubles as a static avatar: it rests on `@` (its fully-bloomed
 * form), which is also what shows when the visitor prefers reduced motion.
 */
export default function BloomSpinner({
  label = 'Thinking',
}: {
  label?: string;
}) {
  const [glyph, setGlyph] = useState(REST);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % FRAMES.length;
      setGlyph(FRAMES[i]);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-block text-violet-600 dark:text-violet-400"
    >
      <span
        aria-hidden="true"
        className="inline-block w-[1.25em] select-none whitespace-pre text-center text-xl font-semibold leading-none"
      >
        {glyph}
      </span>
    </span>
  );
}
