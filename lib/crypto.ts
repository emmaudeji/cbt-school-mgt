import { createHmac, createHash, randomBytes } from 'node:crypto';

function pepper() {
  const value = process.env.CBT_CREDENTIAL_PEPPER;
  if (!value || Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('CBT_CREDENTIAL_PEPPER must contain at least 32 bytes');
  }
  return value;
}
export function credentialVerifier(raw: string) {
  return createHmac('sha256', pepper()).update('cbt-code:v1:').update(raw).digest('hex');
}
export function sourceKey(label: string, value: string) {
  return createHmac('sha256', pepper()).update(`cbt-limit:${label}:`).update(value).digest('hex');
}
export function makeAccessCode() {
  // 80 bits of randomness; printable, safe to hand to young candidates.
  return randomBytes(10).toString('hex').toUpperCase();
}
export function makeCandidateCode() {
  return 'C' + randomBytes(6).toString('hex').toUpperCase();
}
export function makeSessionToken() {
  return randomBytes(32).toString('base64url');
}
export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
