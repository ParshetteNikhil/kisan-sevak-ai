import { createPublicKey, createVerify, type KeyObject } from 'crypto';
import { firebaseConfig } from './firebase-config';

/**
 * Server-side verification of Firebase Auth ID tokens, with no extra
 * dependencies (uses Node's crypto + Google's published signing certs).
 * See: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */

const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certCache: { keys: Record<string, KeyObject>; expiresAt: number } | null = null;

async function getSigningKeys(): Promise<Record<string, KeyObject>> {
  if (certCache && Date.now() < certCache.expiresAt) return certCache.keys;

  const res = await fetch(CERTS_URL, { cache: 'no-store' });
  if (!res.ok) throw new AuthError('Could not fetch token signing keys', 503);

  const pems = (await res.json()) as Record<string, string>;
  const keys: Record<string, KeyObject> = {};
  for (const [kid, pem] of Object.entries(pems)) keys[kid] = createPublicKey(pem);

  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  certCache = { keys, expiresAt: Date.now() + maxAge * 1000 };
  return keys;
}

function decodeSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
}

export class AuthError extends Error {
  constructor(message: string, public status = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export type VerifiedUser = { uid: string; email?: string };

export async function verifyIdToken(idToken: string | null | undefined): Promise<VerifiedUser> {
  if (!idToken || typeof idToken !== 'string') throw new AuthError('Please sign in to use this feature.');

  const parts = idToken.split('.');
  if (parts.length !== 3) throw new AuthError('Invalid sign-in token.');
  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string; kid?: string };
  let payload: { aud?: string; iss?: string; sub?: string; exp?: number; iat?: number; auth_time?: number; email?: string };
  try {
    header = decodeSegment(headerB64);
    payload = decodeSegment(payloadB64);
  } catch {
    throw new AuthError('Invalid sign-in token.');
  }

  const projectId = firebaseConfig.projectId;
  const now = Math.floor(Date.now() / 1000);
  const skew = 60;

  if (header.alg !== 'RS256' || !header.kid) throw new AuthError('Invalid sign-in token.');
  if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new AuthError('Sign-in token is for a different project.');
  }
  if (!payload.sub || typeof payload.sub !== 'string') throw new AuthError('Invalid sign-in token.');
  if (!payload.exp || payload.exp < now - skew) throw new AuthError('Your session expired. Please sign in again.');
  if (!payload.iat || payload.iat > now + skew) throw new AuthError('Invalid sign-in token.');
  if (payload.auth_time && payload.auth_time > now + skew) throw new AuthError('Invalid sign-in token.');

  let keys = await getSigningKeys();
  let key = keys[header.kid];
  if (!key) {
    // Google rotates keys; refresh once before giving up.
    certCache = null;
    keys = await getSigningKeys();
    key = keys[header.kid];
    if (!key) throw new AuthError('Invalid sign-in token.');
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  const ok = verifier.verify(key, Buffer.from(signatureB64, 'base64url'));
  if (!ok) throw new AuthError('Invalid sign-in token.');

  return { uid: payload.sub, email: payload.email };
}

/**
 * Simple per-user rate limiter (in memory, per server instance).
 * Good enough to stop a single account from draining the Gemini quota;
 * move to Firestore/Redis if you scale to many instances.
 */
const PER_MINUTE = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 15);
const PER_DAY = Number(process.env.AI_RATE_LIMIT_PER_DAY || 200);
const usage = new Map<string, number[]>();

export function checkRateLimit(uid: string) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const minuteAgo = now - 60 * 1000;

  const hits = (usage.get(uid) || []).filter((t) => t > dayAgo);
  if (hits.length >= PER_DAY) {
    throw new AuthError('Daily AI limit reached. Please try again tomorrow.', 429);
  }
  if (hits.filter((t) => t > minuteAgo).length >= PER_MINUTE) {
    throw new AuthError('Too many requests. Please wait a minute and try again.', 429);
  }
  hits.push(now);
  usage.set(uid, hits);
}

/** Verify the caller and charge one AI request against their quota. */
export async function requireAiUser(idToken: string | null | undefined): Promise<VerifiedUser> {
  const user = await verifyIdToken(idToken);
  checkRateLimit(user.uid);
  return user;
}
