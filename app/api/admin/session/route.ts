import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

function matches(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const { password } = await request.json() as { password?: string };
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const token = process.env.ADMIN_API_KEY;
  if (!password || !expectedPassword || !token || !matches(password, expectedPassword)) {
    return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, role: 'ADMIN' });
  response.cookies.set('aegle_admin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('aegle_admin', '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
