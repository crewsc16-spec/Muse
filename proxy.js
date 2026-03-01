import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/journal', '/vision-board', '/daily', '/profile', '/quizzes', '/board'];

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for any Supabase session cookie chunk. The Google OAuth session
    // is large and gets split into multiple sb-*-auth-token.N cookies.
    // Bypassing the SSR client here avoids chunked-cookie reconstruction
    // issues in the edge runtime — individual pages do the real auth check.
    // Check raw Cookie header in case Next.js cookie parsing is dropping chunks
    const cookieHeader = request.headers.get('cookie') ?? '';
    const hasSession = cookieHeader.includes('-auth-token') && !cookieHeader.includes('code-verifier');

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/journal/:path*', '/vision-board/:path*', '/daily/:path*', '/profile/:path*', '/quizzes/:path*', '/board/:path*'],
};
