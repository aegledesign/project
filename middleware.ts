import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return NextResponse.next();
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();
  const expected = process.env.ADMIN_API_KEY;
  const role = request.cookies.get('aegle_admin')?.value;
  if (!expected || role !== expected) {
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
