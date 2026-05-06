# Dota Gift Deploy Runbook

## Recommended MVP Setup

- Frontend: Vercel
- Backend: Vercel Serverless Functions
- Database: Neon or Supabase PostgreSQL
- Bot: `@DotaGiftBot`

## 1. Create PostgreSQL

Create a Neon/Supabase database and copy the connection string:

```text
DATABASE_URL=postgresql://...
```

Use a connection string with SSL enabled when the provider requires it.

## 2. Deploy On Vercel

Create a Vercel project from the GitHub repo. The Vite frontend and `/api/*` backend functions deploy together.

Required Vercel env vars:

```text
NODE_ENV=production
ALLOW_DEV_AUTH=false
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
TELEGRAM_BOT_TOKEN=<set in Vercel only>
APP_JWT_SECRET=<long random secret>
ADMIN_TOKEN=<long random admin secret>
DATABASE_URL=<postgres connection string>
```

Never commit `TELEGRAM_BOT_TOKEN`, `APP_JWT_SECRET`, `ADMIN_TOKEN`, or `DATABASE_URL`.

Deploy and copy the app URL:

```text
https://your-vercel-app.vercel.app
```

If frontend and API are hosted on the same Vercel project, `VITE_API_BASE_URL` can be omitted in production.

## 3. Run Database Migration

Run migrations locally with `DATABASE_URL` before deploying code that depends on new tables or columns:

```bash
npm run db:migrate
```

`server/db/schema.sql` is the full new-database schema. Incremental production changes live in `server/db/migrations/*.sql`.

## 4. Configure Telegram Bot

In `@BotFather`:

1. Open `@DotaGiftBot`.
2. Set bot description/about/photo.
3. Configure Mini App/Web App URL to the Vercel app URL.
4. For production auth, make sure backend env has the active bot token.

Important: if the bot token was shared anywhere outside private env storage, revoke it in BotFather before public launch.

## 5. Smoke Test

Open the Mini App from Telegram and check:

- login works without dev auth;
- game state loads;
- create card changes energy;
- merge/delete persists after reload;
- leaderboard loads from API;
- `/api/health` returns `{ "ok": true }`.
- `/api/admin/stats` returns stats when called with `Authorization: Bearer <ADMIN_TOKEN>`.
