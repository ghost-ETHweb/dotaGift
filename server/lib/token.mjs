import crypto from 'node:crypto';

const textEncoder = new TextEncoder();

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(unsignedToken, secret) {
  return crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url');
}

export function createAccessToken(payload, secret, ttlSeconds = 60 * 60 * 24 * 14) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(body))}`;

  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
}

export function verifyAccessToken(token, secret) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) return null;

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsignedToken, secret);
  if (signature.length !== expectedSignature.length) return null;

  const isValidSignature = crypto.timingSafeEqual(textEncoder.encode(signature), textEncoder.encode(expectedSignature));
  if (!isValidSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
