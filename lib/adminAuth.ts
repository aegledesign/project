import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

function equalSecrets(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminRequest(request: Request) {
  if (process.env.NODE_ENV !== 'production') return true;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  const header = request.headers.get('x-admin-key') ?? '';
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)aegle_admin=([^;]+)/)?.[1] ?? '';
  return equalSecrets(header || decodeURIComponent(cookie), expected);
}

export function requireAdmin(request: Request) {
  return isAdminRequest(request)
    ? null
    : NextResponse.json({ error: 'Administrator access required' }, { status: 401 });
}
