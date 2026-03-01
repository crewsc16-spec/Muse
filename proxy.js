import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/journal', '/vision-board', '/daily', '/profile', '/quizzes', '/board'];

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for any Supabase session cookie chunk. The Google OAuth session
    // is large and gets split into multiple sb-*-auth-token.N cookies.
    // Bypassing the SSR client here avoids chunked-cookie reconstruction
    // issues in the edge runtime — individual pages do the real auth check.
    const cookies = request.cookies.getAll();
    const hasSession = cookies.some(
      c => c.name.includes('-auth-token') && !c.name.includes('code-verifier') && c.value
    );

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
