import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession reads from cookies locally (no network call) — more reliable
  // on the edge than getUser() which validates against Supabase servers.
  // Individual pages still call getUser() for secure data access.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/journal', '/vision-board', '/daily', '/profile', '/quizzes', '/board'];

  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/journal/:path*', '/vision-board/:path*', '/daily/:path*', '/profile/:path*', '/quizzes/:path*', '/board/:path*'],
};
