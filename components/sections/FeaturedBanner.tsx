import Link from 'next/link';
import type { Article } from '@/lib/types';

interface FeaturedBannerProps {
  note: Article | null;
}

/**
 * A slim announcement bar pinned just under the nav that promotes whichever
 * published article is assigned the "banner" placement (see lib/field-notes.ts).
 * Uses the article's optional `bannerTitle` / `bannerSubtitle` override copy when
 * set (subtitle renders as a small kicker), otherwise falls back to the article
 * title. The whole bar is one link; renders nothing when no article is assigned.
 */
export default function FeaturedBanner({ note }: FeaturedBannerProps) {
  if (!note) return null;

  const heading = note.bannerTitle || note.title;
  const eyebrow = note.bannerSubtitle;

  return (
    <Link
      href={`/articles/${note.slug}`}
      className="group block w-full border-b border-hair bg-brand/5 transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2.5 px-4 py-2.5">
        <span
          aria-hidden
          className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[1.5px] bg-brand/80"
        />
        {eyebrow ? (
          <span className="hidden shrink-0 text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-brand sm:inline">
            {eyebrow}
          </span>
        ) : null}
        <span
          className={`min-w-0 truncate text-sm leading-none ${
            eyebrow ? 'text-body' : 'font-medium text-ink'
          }`}
        >
          {heading}
        </span>
        <span
          aria-hidden
          className="shrink-0 leading-none text-brand transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>
    </Link>
  );
}
