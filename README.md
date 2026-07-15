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
- `ADMIN_PASSWORD_HASH` — bcrypt hash of the admin login password (see the note below)
- `ANTHROPIC_API_KEY` — only for the chat feature

> **Setting `ADMIN_PASSWORD_HASH`.** Generate the hash:
>
> ```bash
> node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
> ```
>
> Then **escape every `$` in the hash as `\$`** when you paste it into `.env`:
>
> ```bash
> # generated hash:  $2b$10$abc123…            ← raw
> ADMIN_PASSWORD_HASH=\$2b\$10\$abc123…        ← escaped for .env
> ```
>
> Next's env loader runs `dotenv-expand`, so an unescaped `$2b`/`$10`/… is read as a
> variable reference and the hash is silently truncated — the admin login then always
> fails ("invalid password") even though the hash is correct. On Vercel, paste the
> **raw** hash into the dashboard (no escaping there).

That's it — open [http://localhost:3000](http://localhost:3000) (admin at `/admin`, PDF preview at `/resume/preview`).
