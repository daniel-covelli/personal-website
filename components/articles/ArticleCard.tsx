import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate, readingTimeMinutes } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
}

/**
 * Article teaser for the /articles index. Shows the header image (when set),
 * title, publish date, reading time, tags and summary. Drafts get a badge so
 * the admin can tell them apart.
 */
export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hair bg-panel shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {article.headerImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary
        // external URL; next/image needs known dimensions.
        <img
          src={article.headerImageUrl}
          alt=""
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center gap-2 text-xs text-subtle">
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
        <h3 className="mb-2 text-lg font-bold tracking-[-0.01em] text-ink transition-colors group-hover:text-brand">
          {article.title}
        </h3>
        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-body">
          {article.summary}
        </p>
        {article.tags.length ? (
          <div className="flex flex-wrap gap-2">
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
      </div>
    </Link>
  );
}
