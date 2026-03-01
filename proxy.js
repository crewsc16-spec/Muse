import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/journal', '/vision-board', '/daily', '/profile', '/quizzes', '/board'];

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Detect a valid Supabase session by looking for session cookie patterns
    // in the raw Cookie header. Chunked sessions use sb-*-auth-token.N (dot+digit),
    // non-chunked use sb-*-auth-token= (equals sign). The PKCE code-verifier
    // cookie is named sb-*-auth-token-code-verifier, which also contains
    // "-auth-token" but NOT as "-auth-token." or "-auth-token=", so these
    // patterns correctly exclude mid-OAuth states where only the verifier exists.
    const cookieHeader = request.headers.get('cookie') ?? '';
    const hasSession = cookieHeader.includes('-auth-token.') || cookieHeader.includes('-auth-token=');

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
