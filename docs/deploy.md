# Dota Gift Deploy Runbook

## Recommended MVP Setup

- Frontend: Vercel
- Backend: Render Web Service
- Database: Neon or Supabase PostgreSQL
- Bot: `@DotaGiftBot`

## 1. Create PostgreSQL

Create a Neon/Supabase database and copy the connection string:

```text
DATABASE_URL=postgresql://...
```

Use a connection string with SSL enabled when the provider requires it.

## 2. Deploy Backend On Render

Create a Render web service from the GitHub repo.

Use:

```text
Build Command: npm install
Start Command: npm run db:migrate && node server/index.mjs
Health Check Path: /api/health
```

Required env vars:

```text
NODE_ENV=production
PORT=10000
ALLOW_DEV_AUTH=false
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
TELEGRAM_BOT_TOKEN=<set in Render only>
APP_JWT_SECRET=<long random secret>
DATABASE_URL=<postgres connection string>
```

Never commit `TELEGRAM_BOT_TOKEN`, `APP_JWT_SECRET`, or `DATABASE_URL`.

## 3. Deploy Frontend On Vercel

Create a Vercel project from the same GitHub repo.

Required env var:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Deploy and copy the frontend URL:

```text
https://your-vercel-app.vercel.app
```

## 4. Configure Telegram Bot

In `@BotFather`:

1. Open `@DotaGiftBot`.
2. Set bot description/about/photo.
3. Configure Mini App/Web App URL to the Vercel frontend URL.
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
