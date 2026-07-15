import Link from 'next/link';
import type { Article } from '@/lib/types';
import { readingTimeMinutes } from '@/lib/utils';

// Notes filed under an experience rarely have their own art yet, so fall back to
// a deterministic stock photo (seeded by slug). It's rendered as a background
// image, not an <img>, so a failed load simply reveals the denim wash beneath
// instead of a broken-image icon. Swap in a real headerImageUrl via /admin.
function coverUrl(article: Article): string {
  return (
    article.headerImageUrl ||
    `https://picsum.photos/seed/${encodeURIComponent(article.slug)}/640/280`
  );
}

interface FieldNoteCardProps {
  article: Article;
}

/**
 * Compact teaser for a "field note" shown under a work experience. Cover art is
 * desaturated and washed with the brand denim so a grid of otherwise-mismatched
 * stock shots still reads as one set. Meta shows the reading time and the note's
 * own tags.
 */
export default function FieldNoteCard({ article }: FieldNoteCardProps) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hair bg-panel shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-brand/30 to-brand/10">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-80 grayscale transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${coverUrl(article)})` }}
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-brand/20 mix-blend-multiply"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1 flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-[5px] w-[5px] rotate-45 rounded-[1px] bg-brand/70"
          />
          <span className="font-data text-[10px] leading-none tracking-[0.02em] text-subtle">
            {readingTimeMinutes(article.body)} min read
          </span>
        </div>
        <h4 className="text-xs font-bold leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-brand">
          {article.title}
        </h4>
        <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-relaxed text-body">
          {article.summary}
        </p>
        {article.tags.length ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-chip px-1.5 py-0.5 text-[10px] font-medium leading-none text-chip-fg"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
