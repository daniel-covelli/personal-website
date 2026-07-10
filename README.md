# Personal Website / Resume

A [Next.js](https://nextjs.org) resume site with an admin panel and PDF generation. Uses **pnpm**.

## Setup

```bash
pnpm install                 # also downloads Puppeteer's Chromium + generates the Prisma client
cp .env.example .env         # then fill in the values below
pnpm dev                     # http://localhost:3000
```

### Environment variables (`.env`)

- `DATABASE_URL` — Postgres connection string (local dev points at production; no staging DB)
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000`
- `ADMIN_PASSWORD_HASH` — `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`
- `ANTHROPIC_API_KEY` — only for the chat feature

That's it — open [http://localhost:3000](http://localhost:3000) (admin at `/admin`, PDF preview at `/resume/preview`).
