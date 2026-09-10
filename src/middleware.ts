import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/api/login', '/api/auth/check'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/cron/')) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return NextResponse.next();
    if (request.headers.get('authorization') === `Bearer ${secret}`) return NextResponse.next();
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  if (!isPublic && !request.cookies.get('session')) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/settings/:path*'],
};