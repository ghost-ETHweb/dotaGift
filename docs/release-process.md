# Dota Gift Release Process

This process keeps production player progress safe while we continue shipping mechanics, balance updates, and UI fixes.

## Environments

- `local`: development on this machine. Use local JSON storage or a disposable Neon branch.
- `preview`: Vercel preview deployment for a branch or pull request. Use a preview Neon branch, not production data.
- `production`: Telegram bot users. Uses the production Vercel project and production Neon database.

## Safe Change Rules

- Do not delete or recreate the Neon project.
- Do not change production `DATABASE_URL` unless intentionally migrating to a new database.
- Do not run destructive SQL such as `DROP TABLE`, `TRUNCATE`, or broad `DELETE` against production without a backup and explicit approval.
- Treat player fields, card fields, reward claims, and action ledger data as permanent.
- Prefer adding columns or tables over renaming/removing existing fields.
- Balance changes must keep old cards valid. Existing `race`, `stars`, `rarity`, and `state` values must remain readable.

## Bug Fix Flow

1. Reproduce the bug locally or in a preview deployment.
2. Add the smallest code change that fixes the behavior.
3. Run `npm run build`.
4. If the change touches data shape, add a SQL file in `server/db/migrations`.
5. Apply migrations to preview first when possible.
6. Deploy to Vercel production.
7. Smoke test inside Telegram.
8. Check `/api/admin/stats` and Vercel logs after release.

## Database Migration Flow

1. Add a new numbered file in `server/db/migrations`, for example `002_add_example.sql`.
2. Make the SQL idempotent where practical using `IF NOT EXISTS`.
3. Run `npm run db:migrate` against the target database.
4. Deploy code only after the production migration succeeds.

## Product Analytics

Server events are written to `analytics_events`. Current tracked events:

- `signup`
- `login`
- `create_card`
- `merge_cards`
- `delete_card`
- `claim_reward`
- `level_up`
- `trophy_created`
- `referral_signup`

Analytics payloads should avoid raw Telegram ids, bot tokens, access tokens, and other secrets. Store only the minimum event context needed for product and fraud analysis.

## Referral Safety

Referral links use the Telegram Mini App start parameter:

```text
https://t.me/DotaGiftBot?startapp=<referralCode>
```

The server only accepts referral codes that match the internal `ref_...` format, ignores self-referrals, and stores a referral only when the inviter already exists.

The protected endpoint `/api/admin/stats` returns player totals, 24-hour activity, game totals, economy summary, and event counts. Call it with:

```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" https://your-app.vercel.app/api/admin/stats
```

## Rollback

If a release breaks UI only, redeploy the previous Vercel deployment.

If a release writes bad data, pause new actions first, inspect the affected rows, and prepare a corrective migration. Avoid restoring a full database backup unless the corruption is broad, because a restore can erase valid actions made after the backup.
