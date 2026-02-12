import { NextResponse, type NextRequest } from 'next/server';

function getAuthCookiePrefix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return 'sb-auth-token';
  try {
    const hostname = new URL(supabaseUrl).hostname.split('.')[0];
    return `sb-${hostname}-auth-token`;
  } catch {
    return 'sb-auth-token';
  }
}

function hasAuthCookie(request: NextRequest) {
  const prefix = getAuthCookiePrefix();
  const cookies = request.cookies.getAll();
  return cookies.some((cookie) => cookie.name.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers }
  });

  const isSharePage = /^\/trips\/[^/]+\/share/.test(request.nextUrl.pathname);
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth');
  const isOffline = request.nextUrl.pathname === '/_offline';

  if (isSharePage || isLoginPage || isAuthCallback || isOffline) {
    return response;
  }

  if (!hasAuthCookie(request)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: []
};
