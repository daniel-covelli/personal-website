-- Adds a "placement" column controlling where a published article surfaces on
-- the home page:
--   ''        -> nowhere special (only the /articles index)
--   'banner'  -> the announcement bar under the nav
--   <company> -> cards under the resume experience whose company matches exactly
ALTER TABLE "articles" ADD COLUMN "placement" TEXT NOT NULL DEFAULT '';
