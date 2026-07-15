import type { Article as PrismaArticle } from '@prisma/client';
import { Article, ArticleIndexEntry, ArticleInput } from './types';
import { prisma } from './db';

/**
 * Turn a title into a URL-safe slug. Lowercase, spaces/punctuation collapsed to
 * single hyphens, trimmed. Used as the default slug when the admin doesn't set
 * one explicitly.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Serialize a Prisma row into the plain, Client-Component-safe `Article`. */
function toArticle(row: PrismaArticle): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    headerImageUrl: row.headerImageUrl,
    tags: row.tags,
    placement: row.placement,
    bannerTitle: row.bannerTitle,
    bannerSubtitle: row.bannerSubtitle,
    published: row.published,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Newest first. Published posts sort by publish date; drafts (null date) fall
// back to creation time and sort last within the admin list.
const NEWEST_FIRST = [
  { publishedAt: { sort: 'desc', nulls: 'last' } as const },
  { createdAt: 'desc' as const },
];

/** All published articles, newest first (public site + agent index). */
export async function getPublishedArticles(): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: { published: true },
    orderBy: NEWEST_FIRST,
  });
  return rows.map(toArticle);
}

/** Every article including drafts, newest first (admin only). */
export async function getAllArticles(): Promise<Article[]> {
  const rows = await prisma.article.findMany({ orderBy: NEWEST_FIRST });
  return rows.map(toArticle);
}

/**
 * One article by slug. By default only returns published articles so drafts
 * never leak to the public site or the chat assistant; pass
 * `includeDrafts` for admin previews.
 */
export async function getArticleBySlug(
  slug: string,
  { includeDrafts = false }: { includeDrafts?: boolean } = {}
): Promise<Article | null> {
  const row = await prisma.article.findUnique({ where: { slug } });
  if (!row) return null;
  if (!row.published && !includeDrafts) return null;
  return toArticle(row);
}

/** The lightweight index of published articles carried in the agent's prompt. */
export async function getArticleIndex(): Promise<ArticleIndexEntry[]> {
  const rows = await prisma.article.findMany({
    where: { published: true },
    orderBy: NEWEST_FIRST,
    select: {
      slug: true,
      title: true,
      summary: true,
      tags: true,
      publishedAt: true,
    },
  });
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    tags: r.tags,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
  }));
}

/**
 * Render a published article as plain text for the read_article tool result.
 * The assistant gets the full body (Markdown, mermaid source and all) so it can
 * answer detailed questions — the diagrams are text, so it can "read" them too.
 */
export function formatArticleForAgent(article: Article): string {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toISOString().slice(0, 10)
    : 'unpublished';
  const tags = article.tags.length ? `\nTags: ${article.tags.join(', ')}` : '';
  return `# ${article.title}
Published: ${date}${tags}
Summary: ${article.summary}

---

${article.body}`;
}

/**
 * Ensure `slug` is unique, appending -2, -3, … on collision. `ignoreId` lets an
 * update keep its own slug without colliding with itself.
 */
async function ensureUniqueSlug(
  slug: string,
  ignoreId?: string
): Promise<string> {
  const base = slug || 'article';
  let candidate = base;
  let n = 1;
  // Small unbounded-in-theory loop, but slugs collide rarely; bounded in
  // practice by the number of same-titled posts.
  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === ignoreId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

/** Normalize the publish state: publishing without a date stamps it now. */
function resolvePublishedAt(input: ArticleInput): Date | null {
  if (!input.published) return null;
  return input.publishedAt ? new Date(input.publishedAt) : new Date();
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const slug = await ensureUniqueSlug(slugify(input.slug || input.title));
  const row = await prisma.article.create({
    data: {
      slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      headerImageUrl: input.headerImageUrl || '',
      tags: input.tags ?? [],
      placement: input.placement ?? '',
      bannerTitle: input.bannerTitle ?? '',
      bannerSubtitle: input.bannerSubtitle ?? '',
      published: input.published,
      publishedAt: resolvePublishedAt(input),
    },
  });
  return toArticle(row);
}

export async function updateArticle(
  id: string,
  input: ArticleInput
): Promise<Article> {
  const slug = await ensureUniqueSlug(slugify(input.slug || input.title), id);
  const row = await prisma.article.update({
    where: { id },
    data: {
      slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      headerImageUrl: input.headerImageUrl || '',
      tags: input.tags ?? [],
      placement: input.placement ?? '',
      bannerTitle: input.bannerTitle ?? '',
      bannerSubtitle: input.bannerSubtitle ?? '',
      published: input.published,
      publishedAt: resolvePublishedAt(input),
    },
  });
  return toArticle(row);
}

export async function deleteArticle(id: string): Promise<void> {
  await prisma.article.delete({ where: { id } });
}
