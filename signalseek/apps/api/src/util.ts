import { createHash, randomBytes } from 'crypto';
export function hashToken(t: string) { return createHash('sha256').update(t).digest('hex'); }
export function newToken(bytes = 48) { return randomBytes(bytes).toString('hex'); }
export function maskSecret(s: string) {
  if (!s) return '';
  if (s.length <= 8) return '****';
  return s.slice(0, 3) + '****' + s.slice(-3);
}
