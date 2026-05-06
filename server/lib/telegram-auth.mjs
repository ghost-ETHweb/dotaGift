import crypto from 'node:crypto';

export function parseTelegramInitData(initData) {
  const params = new URLSearchParams(initData);
  const userRaw = params.get('user');

  return {
    hash: params.get('hash'),
    authDate: Number(params.get('auth_date') ?? 0),
    user: userRaw ? JSON.parse(userRaw) : null,
    startParam: params.get('start_param'),
    params,
  };
}

export function validateTelegramInitData(initData, botToken, maxAgeSeconds = 60 * 60 * 24) {
  if (!initData || !botToken) return { ok: false, reason: 'MISSING_INIT_DATA_OR_BOT_TOKEN' };

  let parsed;
  try {
    parsed = parseTelegramInitData(initData);
  } catch {
    return { ok: false, reason: 'INVALID_USER_PAYLOAD' };
  }
  if (!parsed.hash) return { ok: false, reason: 'MISSING_HASH' };
  if (!parsed.authDate || Date.now() / 1000 - parsed.authDate > maxAgeSeconds) return { ok: false, reason: 'EXPIRED_AUTH_DATE' };
  if (!parsed.user?.id) return { ok: false, reason: 'MISSING_USER' };

  const pairs = [];
  parsed.params.forEach((value, key) => {
    if (key !== 'hash') pairs.push(`${key}=${value}`);
  });
  const dataCheckString = pairs.sort().join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const incomingHash = parsed.hash;

  if (incomingHash.length !== expectedHash.length) return { ok: false, reason: 'INVALID_HASH' };

  const isValid = crypto.timingSafeEqual(Buffer.from(incomingHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  if (!isValid) return { ok: false, reason: 'INVALID_HASH' };

  return { ok: true, user: parsed.user, startParam: parsed.startParam };
}

export function createDevTelegramUser() {
  return {
    id: 100001,
    first_name: 'Telegram',
    last_name: 'Player',
    username: 'telegram_player',
    language_code: 'en',
  };
}
