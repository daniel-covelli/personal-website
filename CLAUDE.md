# Claude Code Project Guide

## Database (Prisma)

**Local dev connects directly to production.** No staging environment.

### Safe Commands
```bash
npx prisma migrate deploy   # Apply pending migrations
npx prisma generate         # Regenerate client
```

### Dangerous Commands (will destroy prod data)
```bash
npx prisma migrate reset    # Drops entire database
npx prisma migrate dev      # Can reset on drift
npx prisma db seed          # Wipes tables then re-seeds
npx prisma db push          # Can lose data
```

### Adding Schema Changes
```bash
npx prisma migrate dev --name change-name --create-only  # Create only
# Review SQL in prisma/migrations/
npx prisma migrate deploy                                 # Then apply
```

### Files to Update for New Fields
1. `prisma/schema.prisma` - Schema
2. `lib/types.ts` - TypeScript interface
3. `lib/content.ts` - getContent/saveContent
4. Components (print, sections, admin)

---

## PDF Generation

- Endpoint: `/api/pdf` (Puppeteer renders `/resume/print`)
- Preview: `/resume/preview`
- **Margins controlled only via CSS** in `app/print.css` `@page` rule (not Puppeteer options)

---

## Styling

| Context | Location | Tech |
|---------|----------|------|
| Website | `components/sections/` | Tailwind |
| Print/PDF | `components/print/` + `app/print.css` | CSS (pt units) |

---

## Articles

Long-form Markdown posts. Pages: `/articles` (index) and `/articles/[slug]`.

| Concern | Location |
|---------|----------|
| DB model + data access | `Article` in `prisma/schema.prisma`, `lib/articles.ts`, types in `lib/types.ts` |
| Rendering | `components/articles/ArticleMarkdown.tsx` (react-markdown + remark-gfm + rehype-highlight) |
| Diagrams | ` ```mermaid ` blocks → `components/articles/Mermaid.tsx` (client, theme-aware) |
| Code highlight theme | `.article-prose` rules in `app/globals.css` (light + dark) |
| Admin CRUD | `components/admin/ArticlesEditor.tsx` + `app/api/articles/` (writes need admin session) |

- **Images are URL-based**, but header images can also be **uploaded**: the Writing tab's "Upload" button POSTs to `app/api/upload/route.ts` (admin-gated, Vercel Blob, needs `BLOB_READ_WRITE_TOKEN`) and drops the returned public URL into `headerImageUrl`. Body/inline images are still paste-a-URL (`header.imageUrl` follows the same paste pattern). `data:` URIs are stripped by react-markdown's sanitizer; use `https://`.
- **Agent drill-down:** the chat carries a lightweight index of *published* articles in its system prompt (`buildSystemPrompt` in `lib/chat.ts`) and pulls a full body on demand via the `read_article` tool — a streaming tool-use loop in `app/api/chat/route.ts`. Drafts are never exposed to the chat or the public site.
- On the home page, each published article can be assigned a **`placement`** (an `Article` column, set in the Writing tab of `/admin`; logic in `lib/field-notes.ts`): `banner` promotes it to the announcement bar under the nav (`components/sections/FeaturedBanner.tsx`, with optional `bannerTitle`/`bannerSubtitle` override copy), or an exact resume **company** renders it as cards under that experience (`components/sections/ExperienceFieldNotes.tsx` → `components/articles/FieldNoteCard.tsx`). Empty = home-page index only.
