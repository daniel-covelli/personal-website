-- Optional per-article override copy for the top announcement bar. Empty means
-- fall back to the article's own title.
ALTER TABLE "articles" ADD COLUMN "banner_title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "articles" ADD COLUMN "banner_subtitle" TEXT NOT NULL DEFAULT '';
