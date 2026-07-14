import Link from 'next/link';
import { Article } from '@/lib/types';
import { readingTimeMinutes } from '@/lib/utils';

interface FieldNotesProps {
  data: Article[];
}

// Seconds of travel per note. Deriving the lap time from the note count keeps
// the glide speed roughly constant no matter how much I've written — more notes
// make a longer track *and* a proportionally longer lap.
const SECONDS_PER_NOTE = 5;

// Minimum notes in a single half-track so the stream fills wide viewports before
// it loops. With only a handful of articles we repeat the list to reach this
// floor; the two identical halves are what make the CSS loop seamless.
const MIN_PER_HALF = 8;

// Notes slip past the fixed label on the left and dissolve off the right edge
// instead of clipping hard — the same masking idea as the hero's dotted field.
const edgeFade =
  'linear-gradient(90deg, transparent 0, #000 2%, #000 92%, transparent 100%)';

/**
 * One field note: a denim waypoint, the article title, its topics as chips, and
 * the reading time in the monospaced data face. The whole note is the link. The
 * duplicated half of the track passes `muted` so its copies are hidden from
 * assistive tech and keyboard tab order.
 */
function Note({ article, muted }: { article: Article; muted?: boolean }) {
  const tags = article.tags.slice(0, 2);
  const mins = readingTimeMinutes(article.body);

  return (
    <Link
      href={`/articles/${article.slug}`}
      aria-hidden={muted || undefined}
      tabIndex={muted ? -1 : undefined}
      className="group/note flex shrink-0 items-center gap-3 whitespace-nowrap rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
    >
      <span
        aria-hidden
        className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[1.5px] bg-brand/75 transition-colors group-hover/note:bg-brand"
      />
      <span className="text-sm font-medium leading-none tracking-[-0.01em] text-ink transition-colors group-hover/note:text-brand">
        {article.title}
      </span>
      {tags.length > 0 && (
        <span className="flex shrink-0 items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-chip px-1.5 py-0.5 text-[11px] font-medium leading-none text-chip-fg"
            >
              {tag}
            </span>
          ))}
        </span>
      )}
      <span className="font-data text-[11px] leading-none tracking-[0.02em] text-subtle">
        {mins} min
      </span>
    </Link>
  );
}

/**
 * "Field Notes" — a full-bleed, single-line ticker of published writing that
 * sits between the hero and the experience timeline. A fixed label is pinned to
 * the page's left edge; the notes stream past it. The marquee is pure CSS (two
 * identical halves translated -50%), so this stays a Server Component: it pauses
 * on hover/focus and collapses to a scrollable row under reduced motion with no
 * client JavaScript. Renders nothing when there's no published writing.
 */
export default function FieldNotes({ data }: FieldNotesProps) {
  if (data.length === 0) return null;

  const repsPerHalf = Math.max(1, Math.ceil(MIN_PER_HALF / data.length));
  const half = Array.from({ length: repsPerHalf }, () => data).flat();
  const duration = half.length * SECONDS_PER_NOTE;

  return (
    <section
      aria-label="Field Notes"
      className="w-full border-y border-hair bg-surface"
    >
      <div className="flex items-stretch">
        {/* Fixed "channel" label pinned to the page's left edge. */}
        <div className="flex shrink-0 items-center border-r border-hair py-[18px] pl-6 pr-4 sm:pl-8">
          <h2 className="text-[11px] font-bold uppercase leading-none tracking-[0.2em] text-brand">
            Field Notes
          </h2>
        </div>

        {/* Streaming ticker. */}
        <div
          className="group relative min-w-0 flex-1 overflow-hidden py-[18px] pl-5 motion-reduce:overflow-x-auto"
          style={{ maskImage: edgeFade, WebkitMaskImage: edgeFade }}
        >
          <div
            className="flex w-max will-change-transform animate-field-notes group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none"
            style={{ '--fn-duration': `${duration}s` } as React.CSSProperties}
          >
            <ul className="flex w-max items-center gap-8 pr-8">
              {half.map((article, i) => (
                <li key={`note-${article.id}-${i}`}>
                  <Note article={article} />
                </li>
              ))}
            </ul>
            <ul
              className="flex w-max items-center gap-8 pr-8 motion-reduce:hidden"
              aria-hidden
            >
              {half.map((article, i) => (
                <li key={`echo-${article.id}-${i}`}>
                  <Note article={article} muted />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
