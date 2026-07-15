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

- **Images are URL-based** (no upload infra) — same pattern as `header.imageUrl`. `data:` URIs are stripped by react-markdown's sanitizer; use `https://`.
- **Agent drill-down:** the chat carries a lightweight index of *published* articles in its system prompt (`buildSystemPrompt` in `lib/chat.ts`) and pulls a full body on demand via the `read_article` tool — a streaming tool-use loop in `app/api/chat/route.ts`. Drafts are never exposed to the chat or the public site.
- On the home page, published field notes surface in two spots (see `lib/field-notes.ts`): the "behind the scenes" note (slug `what-this-site-can-do`) is promoted to an announcement bar under the nav (`components/sections/AboutSiteBanner.tsx`), and notes tagged for a company render as cards under that experience (`components/sections/ExperienceFieldNotes.tsx` → `components/articles/FieldNoteCard.tsx`).
