import fs from 'node:fs';

function loadDotEnv() {
  if (!fs.existsSync('.env')) return;

  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

export function readEnv() {
  loadDotEnv();
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: Number(process.env.PORT ?? 8787),
    clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    jwtSecret: process.env.APP_JWT_SECRET ?? 'dev-secret-change-me',
    adminToken: process.env.ADMIN_TOKEN ?? '',
    allowDevAuth: process.env.ALLOW_DEV_AUTH !== 'false',
    devDbPath: process.env.DEV_DB_PATH ?? 'server/data/dev-db.json',
    databaseUrl: process.env.DATABASE_URL ?? '',
  };
}
