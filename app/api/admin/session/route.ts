import { NextResponse } from 'next/server';
import {
  updateAdminPassword,
  validateNewPassword,
  verifyAdminPassword,
} from '@/lib/adminCredentials';

export const runtime = 'nodejs';

function authenticatedResponse(body: Record<string, unknown>) {
  const token = process.env.ADMIN_API_KEY;
  if (!token) return NextResponse.json({ error: 'Admin API key is not configured' }, { status: 503 });
  const response = NextResponse.json(body);
  response.cookies.set('aegle_admin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function POST(request: Request) {
  const { password } = await request.json() as { password?: string };
  if (!password || !(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
  }
  return authenticatedResponse({ ok: true, role: 'ADMIN' });
}

export async function PUT(request: Request) {
  const body = await request.json() as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  if (!body.currentPassword || !(await verifyAdminPassword(body.currentPassword))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }
  if (!body.newPassword || body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
  }
  const validationError = validateNewPassword(body.newPassword);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  if (await verifyAdminPassword(body.newPassword)) {
    return NextResponse.json({ error: 'New password must differ from the current password' }, { status: 400 });
  }
  await updateAdminPassword(body.newPassword);
  return authenticatedResponse({ ok: true, role: 'ADMIN', passwordChanged: true });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('aegle_admin', '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
