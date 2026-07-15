import type { Article } from './types';

/**
 * "Field notes" placement rules — deliberately lightweight, temporary wiring
 * that needs no schema change. Both rules key off data that already lives on
 * each Article (its slug and its tags), set through the admin editor:
 *
 *  1. The single "behind the scenes" note about this site is matched by slug
 *     and promoted to the announcement bar under the nav.
 *  2. Every other note is filed under a work experience by matching one of its
 *     tags to a company. For now only Lindy.ai has notes; add rows to
 *     NOTE_TAG_BY_COMPANY to file notes under other roles later.
 */

/** Slug of the note promoted to the top-of-page announcement bar. */
export const ABOUT_SITE_SLUG = 'what-this-site-can-do';

/** Experience `company` (exact string) → the article tag that files notes under it. */
export const NOTE_TAG_BY_COMPANY: Record<string, string> = {
  'Lindy.ai': 'Lindy',
};

/** The note promoted to the announcement bar, or null when it isn't published. */
export function getAboutSiteNote(articles: Article[]): Article | null {
  return articles.find((a) => a.slug === ABOUT_SITE_SLUG) ?? null;
}

/**
 * Group notes under the experiences they belong to: a map of `company` → notes
 * (kept in the incoming newest-first order). The about-site note is always
 * excluded so it can't double up in a card grid, and companies with no matching
 * notes are omitted so callers can treat a missing key as "nothing to show".
 */
export function getNotesByCompany(
  articles: Article[]
): Record<string, Article[]> {
  const byCompany: Record<string, Article[]> = {};
  for (const [company, tag] of Object.entries(NOTE_TAG_BY_COMPANY)) {
    const notes = articles.filter(
      (a) => a.slug !== ABOUT_SITE_SLUG && a.tags.includes(tag)
    );
    if (notes.length) byCompany[company] = notes;
  }
  return byCompany;
}
