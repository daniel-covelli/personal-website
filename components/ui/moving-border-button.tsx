'use client';

import {
  ButtonHTMLAttributes,
  forwardRef,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { cn } from '@/lib/utils';

// Vibrant "Nebula" treatment (chosen in the hero-CTA prototype): a
// pink -> violet -> indigo gradient face framed by a dark hairline, with
// white/cyan/violet comets orbiting the border like Aceternity's moving-border.
const FACE_GRADIENT =
  'linear-gradient(125deg, #db2777 0%, #7c3aed 50%, #4f46e5 100%)';
const GLOSS =
  'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 46%)';
const TEXT_SHADOW = '0 1px 2px rgba(0,0,0,0.28)';

interface Comet {
  size: number; // px
  background: string;
  opacity: number;
  phase: number; // 0..1 offset around the border
}

const COMETS: Comet[] = [
  {
    size: 84,
    background:
      'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 54%)',
    opacity: 1,
    phase: 0,
  },
  {
    size: 124,
    background: 'radial-gradient(circle, #67e8f9 0%, rgba(103,232,249,0) 58%)',
    opacity: 0.85,
    phase: 0.38,
  },
  {
    size: 124,
    background: 'radial-gradient(circle, #c4b5fd 0%, rgba(196,181,253,0) 58%)',
    opacity: 0.85,
    phase: 0.7,
  },
];

/**
 * Animates comets around the button's rounded-rectangle border by walking an
 * SVG <rect> path with getPointAtLength on each frame — the same technique as
 * Aceternity's moving-border, but dependency-free. Honors reduced motion.
 */
function MovingBorder({ duration = 3600 }: { duration?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const rect = rectRef.current;
    if (!container || !rect) return;

    const comets = Array.from(
      container.querySelectorAll<HTMLElement>('[data-comet]')
    );

    const sizeRect = () => {
      const box = container.getBoundingClientRect();
      if (!box.width || !box.height) return;
      rect.setAttribute('width', String(box.width));
      rect.setAttribute('height', String(box.height));
      const r = String(box.height / 2);
      rect.setAttribute('rx', r);
      rect.setAttribute('ry', r);
    };
    sizeRect();

    const resizeObserver = new ResizeObserver(sizeRect);
    resizeObserver.observe(container);

    const place = (frac: number) => {
      const length = rect.getTotalLength();
      if (!length) return;
      for (const comet of comets) {
        const phase = Number(comet.dataset.phase) || 0;
        const point = rect.getPointAtLength(((frac + phase) % 1) * length);
        comet.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
      }
    };

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let raf = 0;
    if (prefersReducedMotion) {
      place(0.12); // park the comets at a pleasant spot, no animation
    } else {
      const frame = (time: number) => {
        place((time / duration) % 1);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [duration]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <rect ref={rectRef} fill="none" />
      </svg>
      {COMETS.map((comet, i) => (
        <span
          key={i}
          data-comet
          data-phase={comet.phase}
          className="absolute left-0 top-0 rounded-full"
          style={{
            width: comet.size,
            height: comet.size,
            background: comet.background,
            opacity: comet.opacity,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}

interface MovingBorderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Extra classes on the outer button (positioning, etc.). */
  containerClassName?: string;
  /** Extra classes on the inner gradient face (padding, size). */
  faceClassName?: string;
  /** Milliseconds per lap of the moving border. */
  duration?: number;
}

/**
 * A vibrant, animated-border button. The caller supplies the face's padding or
 * size via `faceClassName` (a pill CTA vs. a circular icon launcher).
 */
export const MovingBorderButton = forwardRef<
  HTMLButtonElement,
  MovingBorderButtonProps
>(function MovingBorderButton(
  { children, containerClassName, faceClassName, duration, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex rounded-full bg-[#0a0f1e] p-[2px] outline-none transition-transform duration-200 ease-out hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        containerClassName
      )}
      {...props}
    >
      <MovingBorder duration={duration} />
      <span
        className={cn(
          'relative z-10 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold text-white',
          faceClassName
        )}
        style={{ background: FACE_GRADIENT, textShadow: TEXT_SHADOW }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: GLOSS }}
        />
        <span className="relative inline-flex items-center gap-2">
          {children}
        </span>
      </span>
    </button>
  );
});
