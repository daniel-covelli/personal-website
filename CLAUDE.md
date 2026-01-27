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
