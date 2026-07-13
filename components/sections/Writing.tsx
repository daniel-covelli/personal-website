import { Article } from '@/lib/types';
import ArticleCard from '@/components/articles/ArticleCard';
import SectionHeading from './SectionHeading';

interface WritingProps {
  data: Article[];
}

/**
 * Home-page teaser for the articles section. Shows the most recent published
 * posts with a link to the full /articles index. Renders nothing when there
 * are no published articles.
 */
export default function Writing({ data }: WritingProps) {
  if (data.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading>Writing</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2">
          {data.slice(0, 4).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <div className="mt-6">
          <a
            href="/articles"
            className="text-sm font-medium text-brand transition-colors hover:text-brand-strong"
          >
            View all writing →
          </a>
        </div>
      </div>
    </section>
  );
}
