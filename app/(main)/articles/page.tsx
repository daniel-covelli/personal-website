import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getPublishedArticles, getAllArticles } from '@/lib/articles';
import Nav from '@/components/Nav';
import ChatButton from '@/components/chat/ChatButton';
import ArticleCard from '@/components/articles/ArticleCard';
import { ThemeProvider } from '@/components/ThemeProvider';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Writing',
  description: 'Articles and technical writing.',
};

export default async function ArticlesPage() {
  const [content, session] = await Promise.all([
    getContent(),
    getServerSession(authOptions),
  ]);
  const isAdmin = !!session;

  // Admins see drafts inline; the public sees only published posts.
  const articles = isAdmin
    ? await getAllArticles()
    : await getPublishedArticles();

  return (
    <ThemeProvider>
      <main>
        <Nav name={content.header.name} />
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-[-0.02em] text-ink md:text-4xl">
                  Writing
                </h1>
                <p className="mt-2 text-subtle">
                  Notes, deep dives, and technical write-ups.
                </p>
              </div>
              {isAdmin ? (
                <a
                  href="/admin/writing"
                  className="shrink-0 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-solid-hover"
                >
                  New article
                </a>
              ) : null}
            </div>

            {articles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-hair bg-panel px-6 py-16 text-center text-subtle">
                No articles yet — check back soon.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>
        <footer className="px-4 py-8">
          <div className="mx-auto max-w-3xl text-sm text-subtle">
            <a href="/" className="transition-colors hover:text-ink">
              ← Back home
            </a>
          </div>
        </footer>
        <ChatButton personName={content.header.name} isAdmin={isAdmin} />
      </main>
    </ThemeProvider>
  );
}
