# Dota Gift Production MVP

## What Is Ready Now

- Frontend: React, TypeScript, Tailwind, Zustand, Telegram-friendly mobile UI.
- Backend API scaffold: built on Node HTTP with no runtime dependencies.
- Telegram login endpoint with `initData` signature validation.
- HMAC access token for protected API calls.
- Server-owned game operations: create card, merge cards, delete card, claim reward.
- Server-owned balance: energy, XP, level progression, trophy merge, reward claiming.
- Basic anti-fraud: client action IDs, duplicate action rejection, action frequency limits.
- Dev storage: JSON file at `server/data/dev-db.json`.
- Production storage: PostgreSQL when `DATABASE_URL` is set.

## Local API

```bash
npm run server:dev
```

Default API URL:

```text
http://localhost:8787
```

The frontend API client reads:

```text
VITE_API_BASE_URL=http://localhost:8787
```

## Database

Run migrations with:

```bash
npm run db:migrate
```

If `DATABASE_URL` is not set, the server falls back to local JSON storage.

## Environment

Copy `.env.example` to `.env` for local server settings.

Important production variables:

- `TELEGRAM_BOT_TOKEN`: required for real Telegram auth.
- `APP_JWT_SECRET`: must be a long random secret.
- `ALLOW_DEV_AUTH=false`: production must disable demo login fallback.
- `CLIENT_ORIGIN`: final Mini App web origin.

## API Endpoints

- `GET /api/health`
- `POST /api/auth/telegram`
- `GET /api/profile`
- `GET /api/game-state`
- `POST /api/cards/create`
- `POST /api/cards/move`
- `POST /api/cards/merge`
- `POST /api/cards/delete`
- `POST /api/rewards/claim`
- `GET /api/leaderboard`
- `GET /api/trophies`
- `GET /api/referrals/stats`

## Next Production Steps

1. Replace JSON storage with PostgreSQL.
2. Add migrations for users, cards, trophies, rewards, action ledger, referrals.
3. Wire frontend store to `apiClient` and keep optimistic UI only after server confirmation.
4. Add server-side session refresh and token rotation.
5. Add structured logs and analytics events.
6. Add deploy config for API and frontend.
7. Add Telegram bot setup: Mini App URL, domain, commands, production bot token.
8. Add anti-fraud hardening: IP/device fingerprints, suspicious action scoring, referral abuse checks.
