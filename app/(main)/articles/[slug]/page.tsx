import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getArticleBySlug } from '@/lib/articles';
import Nav from '@/components/Nav';
import ChatButton from '@/components/chat/ChatButton';
import ArticleMarkdown from '@/components/articles/ArticleMarkdown';
import { ThemeProvider } from '@/components/ThemeProvider';
import { formatDate, readingTimeMinutes } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: 'Article not found' };
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
      images: article.headerImageUrl ? [article.headerImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const [content, session] = await Promise.all([
    getContent(),
    getServerSession(authOptions),
  ]);
  const isAdmin = !!session;

  // Admins can preview drafts; everyone else only sees published articles.
  const article = await getArticleBySlug(params.slug, { includeDrafts: isAdmin });
  if (!article) notFound();

  return (
    <ThemeProvider>
      <main>
        <Nav name={content.header.name} />
        <article className="px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <a
              href="/articles"
              className="text-sm text-subtle transition-colors hover:text-ink"
            >
              ← All writing
            </a>

            {article.headerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary
              // external URL; next/image needs known dimensions.
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
              Want to go deeper on this piece? Tap the assistant in the corner —
              it can pull up this article and talk through the details with you.
            </div>
          </div>
        </article>
        <ChatButton personName={content.header.name} isAdmin={isAdmin} />
      </main>
    </ThemeProvider>
  );
}
