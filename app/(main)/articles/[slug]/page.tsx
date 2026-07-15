import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getArticleBySlug } from '@/lib/articles';
import Nav from '@/components/Nav';
import ChatButton from '@/components/chat/ChatButton';
import ArticleView from '@/components/articles/ArticleView';
import { ThemeProvider } from '@/components/ThemeProvider';

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
  const article = await getArticleBySlug(params.slug, {
    includeDrafts: isAdmin,
  });
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

            <ArticleView article={article} />
          </div>
        </article>
        <ChatButton personName={content.header.name} isAdmin={isAdmin} />
      </main>
    </ThemeProvider>
  );
}
