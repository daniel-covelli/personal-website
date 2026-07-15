import type { Article } from './types';

/**
 * Home-page placement for a published article, stored in `article.placement`
 * and set from the admin editor. One of:
 *   - '' (empty)                → not featured on the home page (still /articles)
 *   - BANNER_PLACEMENT          → the announcement bar under the nav
 *   - an exact resume `company` → cards under that experience
 */
export const BANNER_PLACEMENT = 'banner';

/** The article assigned to the announcement bar, or null when none is. */
export function getBannerNote(articles: Article[]): Article | null {
  return articles.find((a) => a.placement === BANNER_PLACEMENT) ?? null;
}

/**
 * Group articles by the resume company they're assigned to: a map of
 * `company` → notes, kept in the incoming (newest-first) order. Articles with no
 * placement, or the banner one, are left out — so a company key is present only
 * when it has notes to show.
 */
export function getNotesByCompany(
  articles: Article[]
): Record<string, Article[]> {
  const byCompany: Record<string, Article[]> = {};
  for (const article of articles) {
    const target = article.placement;
    if (!target || target === BANNER_PLACEMENT) continue;
    (byCompany[target] ??= []).push(article);
  }
  return byCompany;
}
