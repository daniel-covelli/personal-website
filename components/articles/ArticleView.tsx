import ArticleMarkdown from './ArticleMarkdown';
import { formatDate, readingTimeMinutes } from '@/lib/utils';

/**
 * The fields needed to render an article's full reading view. A structural
 * subset of `Article`, so the public page can pass its DB record straight in,
 * and the admin editor can map its in-progress form state to the same shape.
 */
export interface ArticleViewData {
  title: string;
  summary: string;
  body: string;
  headerImageUrl: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
}

/**
 * The article end-state — header image, tags, title, meta, summary, rendered
 * Markdown body, and the closing assistant CTA. Shared verbatim between
 * `/articles/[slug]` (rendered on the server for SEO) and the admin editor's
 * live preview (bundled into the client editor), so the preview always matches
 * exactly what a reader sees. The site's "← All writing" back link stays with
 * the page, since it's navigation rather than article content.
 *
 * No `'use client'`: the component has no client-only dependencies, so React
 * renders it on the server for the public page while still allowing the client
 * editor to import it for a live-updating preview.
 */
export default function ArticleView({ article }: { article: ArticleViewData }) {
  return (
    <>
      {article.headerImageUrl ? (
        // Arbitrary external URL; next/image needs known dimensions.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.headerImageUrl}
          alt=""
          className="mb-8 mt-6 max-h-[420px] w-full rounded-xl border border-hair object-cover shadow-soft"
        />
      ) : null}

      <header className="mb-8 mt-4">
        {article.tags.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-chip px-2 py-1 text-xs text-chip-fg"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
          {article.title}
        </h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-subtle">
          {!article.published ? (
            <span className="rounded bg-chip px-1.5 py-0.5 font-medium text-chip-fg">
              Draft
            </span>
          ) : null}
          {article.publishedAt ? (
            <time dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          ) : null}
          <span aria-hidden>·</span>
          <span>{readingTimeMinutes(article.body)} min read</span>
        </div>
        {article.summary ? (
          <p className="mt-5 text-lg leading-relaxed text-body">
            {article.summary}
          </p>
        ) : null}
      </header>

      <ArticleMarkdown>{article.body}</ArticleMarkdown>

      <div className="mt-16 rounded-lg border border-hair bg-panel p-5 text-sm text-subtle">
        Want to go deeper on this piece? Tap the assistant in the corner — it
        can pull up this article and talk through the details with you.
      </div>
    </>
  );
}
