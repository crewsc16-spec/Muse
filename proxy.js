import { NextResponse } from 'next/server';

export async function proxy(request) {
  // Vercel's Edge Runtime strips cookies whose names contain a dot (e.g.
  // sb-*-auth-token.0 / .1 / .2) from the Cookie header it passes to
  // middleware — even though those same cookies are sent correctly to
  // Node.js API routes.  Any cookie-based session check here will therefore
  // always fail for Google OAuth users (whose large session is chunked with
  // dot-suffixed cookie names).  Auth is enforced at the page level via the
  // Supabase browser client, and all data is protected server-side by
  // Supabase Row-Level Security, so a middleware guard is not required.
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/journal/:path*', '/vision-board/:path*', '/daily/:path*', '/profile/:path*', '/quizzes/:path*', '/board/:path*'],
};
