import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookiesToSet = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookies) { cookiesToSet.push(...cookies); },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Return a 200 HTML page that redirects via JS instead of a 302.
      // Safari ITP can restrict cookies set during a cross-site redirect
      // chain (Google → yourmuse.app) from being sent on subsequent requests.
      // A JS redirect from a 200 response sets cookies in a first-party
      // context, which Safari honours without restriction.
      const dest = JSON.stringify(`${origin}${next}`);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><script>window.location.replace(${dest})</script></head><body></body></html>`;

      const res = new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache',
        },
      });

      cookiesToSet.forEach(({ name, value, options }) => {
        res.cookies.set(name, value, options ?? {});
      });

      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
