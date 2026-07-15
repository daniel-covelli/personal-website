import Link from 'next/link';
import type { Article } from '@/lib/types';

interface AboutSiteBannerProps {
  note: Article | null;
}

/**
 * A slim announcement bar pinned just under the nav that promotes the single
 * "behind the scenes" note about this site. The whole bar is one link. Renders
 * nothing when that note isn't published, so the layout is unaffected. The
 * denim wash and rotated marker echo the site's accent language.
 */
export default function AboutSiteBanner({ note }: AboutSiteBannerProps) {
  if (!note) return null;

  return (
    <Link
      href={`/articles/${note.slug}`}
      className="group block w-full border-b border-hair bg-brand/5 transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2.5 px-4 py-2.5">
        <span className="hidden items-center gap-2 sm:inline-flex">
          <span
            aria-hidden
            className="h-[7px] w-[7px] rotate-45 rounded-[1.5px] bg-brand/80"
          />
          <span className="text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-brand">
            Behind the scenes
          </span>
        </span>
        <span className="text-sm leading-none text-body">
          How this interactive resume actually works
        </span>
        <span
          aria-hidden
          className="leading-none text-brand transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>
    </Link>
  );
}
