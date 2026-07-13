/**
 * The single loading spinner used across the app (chat send button, chat
 * history loader, resume-download buttons, …).
 *
 * It draws a spinning ring in `currentColor`, so it automatically matches the
 * text color of whatever it sits inside — pass a `text-*` class (or let it
 * inherit) to recolor it, and size it with an `h-*`/`w-*` class.
 */
interface SpinnerProps {
  /** Sizing (and optional color) utility classes, e.g. "h-5 w-5 text-brand". */
  className?: string;
  /** Accessible label for screen readers. */
  label?: string;
}

export function Spinner({ className = 'h-5 w-5', label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
