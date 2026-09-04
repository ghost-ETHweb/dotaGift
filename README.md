# DotaGift

DotaGift is a Telegram Mini App game about Dota-inspired collectible cards. Players create cards with energy, merge matching cards, earn XP, collect trophies, invite referrals, and compete in the seasonal Race War leaderboard.

Telegram bot: [@DotaGiftBot](https://t.me/DotaGiftBot)

## What The Bot Does

- Opens the Telegram Mini App from the bot menu.
- Handles basic bot commands and inline buttons: start, about, and how to play.
- Authenticates Telegram users through Telegram WebApp init data.
- Stores real player progress in PostgreSQL.
- Tracks cards, merges, XP, energy, trophies, referrals, leaderboard data, and race season state.

## Main Features

- Card board with mobile-friendly tap and drag merging.
- Energy system with regeneration timer.
- XP progression and level rewards.
- Collection with trophies, seasonal cards, and future boost-card slots.
- Race War season where users choose a race once per season.
- Race leaderboard based on real trophy/player data.
- Referral links and first-level referral stats.
- Profile settings: language, nickname, avatar mode, race avatar, and future account links.
- Admin stats endpoint for product monitoring.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js HTTP server
- Database: PostgreSQL through Neon
- Hosting: Vercel
- Telegram: Telegram Bot API and Telegram WebApp SDK

## Local Development

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev -- --port 5173
```

Run backend locally:

```bash
npm run server:dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8787`

## Environment Variables

Required for production:

```env
DATABASE_URL=
TELEGRAM_BOT_TOKEN=
APP_JWT_SECRET=
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
ADMIN_TOKEN=
```

Optional:

```env
TELEGRAM_WEBHOOK_SECRET=
ALLOW_DEV_AUTH=false
DEV_DB_PATH=server/data/dev-db.json
```

`TELEGRAM_WEBHOOK_SECRET` is used to verify Telegram webhook requests when configured.

## Telegram Webhook

After deployment, register the webhook with Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://your-vercel-app.vercel.app/api/telegram/webhook\",\"allowed_updates\":[\"message\",\"callback_query\"]}"
```

If `TELEGRAM_WEBHOOK_SECRET` is configured, include it in the webhook registration:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://your-vercel-app.vercel.app/api/telegram/webhook\",\"allowed_updates\":[\"message\",\"callback_query\"],\"secret_token\":\"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

## Useful Scripts

```bash
npm run build
npm run db:migrate
npm run server:dev
```

## Current MVP Status

The project is already more than a simple command-response bot. It includes persistent data, Telegram Mini App authentication, backend game mechanics, production deployment, referrals, leaderboard logic, and seasonal race mechanics.

Planned production improvements:

- Full admin dashboard.
- Better analytics for retention, energy economy, and merges.
- Real moderation/legal pages for prize, prediction, and partner mechanics.
- Partner boost cards and event-based seasonal content.
- More complete anti-cheat and abuse prevention.
