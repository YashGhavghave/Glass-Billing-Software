import { createHmac, timingSafeEqual } from 'crypto';

export const AUTH_COOKIE_NAME = 'windoor_auth';
const TOKEN_ALGO = 'sha256';
const TOKEN_VERSION = 'v1';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'dev-windoor-auth-secret-change-me';
  return secret;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  if (pad) normalized += '='.repeat(4 - pad);
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function sign(input) {
  const secret = getSecret();
  return createHmac(TOKEN_ALGO, secret).update(input).digest('base64url');
}

export function createAuthToken(payload, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
    v: TOKEN_VERSION,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!payload?.exp || nowSeconds >= payload.exp) return null;
    if (payload?.v !== TOKEN_VERSION) return null;
    return payload;
  } catch {
    return null;
  }
}
