import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readJson, writeJson } from './dataStore';

const scrypt = promisify(scryptCallback);
const credentialFile = 'admin-auth.json';

type StoredCredential = {
  version: 1;
  salt: string;
  hash: string;
  updatedAt: string;
};

async function derive(password: string, salt: string) {
  return scrypt(password, salt, 64) as Promise<Buffer>;
}

function constantTimeTextMatch(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function verifyAdminPassword(password: string) {
  const stored = await readJson<StoredCredential | null>(credentialFile, null);
  if (stored) {
    const actual = await derive(password, stored.salt);
    const expected = Buffer.from(stored.hash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  const initialPassword = process.env.ADMIN_PASSWORD;
  return Boolean(initialPassword && constantTimeTextMatch(password, initialPassword));
}

export function validateNewPassword(password: string) {
  if (password.length < 12) return 'Password must contain at least 12 characters';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, and numeric characters';
  }
  return null;
}

export async function updateAdminPassword(password: string) {
  const salt = randomBytes(24).toString('hex');
  const hash = await derive(password, salt);
  const credential: StoredCredential = {
    version: 1,
    salt,
    hash: hash.toString('hex'),
    updatedAt: new Date().toISOString(),
  };
  await writeJson(credentialFile, credential);
}
