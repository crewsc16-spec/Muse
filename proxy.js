import { NextResponse } from 'next/server';

export async function proxy(request) {
  // DIAGNOSTIC: pass everything through to confirm middleware is the redirect source
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/journal/:path*', '/vision-board/:path*', '/daily/:path*', '/profile/:path*', '/quizzes/:path*', '/board/:path*'],
};
