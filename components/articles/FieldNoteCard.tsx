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
 * stock shots still reads as one set. "Coming soon" notes swap the reading time
 * for a small status chip.
 */
export default function FieldNoteCard({ article }: FieldNoteCardProps) {
  const comingSoon = /coming soon/i.test(article.summary);
  const summary = article.summary
    .replace(/\s*\(coming soon\.?\)\s*/i, ' ')
    .trim();

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hair bg-panel shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-brand/30 to-brand/10">
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
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            aria-hidden
            className="h-[6px] w-[6px] rotate-45 rounded-[1px] bg-brand/70"
          />
          {comingSoon ? (
            <span className="font-data text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-brand">
              Coming soon
            </span>
          ) : (
            <span className="font-data text-[11px] leading-none tracking-[0.02em] text-subtle">
              {readingTimeMinutes(article.body)} min read
            </span>
          )}
        </div>
        <h4 className="text-sm font-bold leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-brand">
          {article.title}
        </h4>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-body">
          {summary}
        </p>
      </div>
    </Link>
  );
}
