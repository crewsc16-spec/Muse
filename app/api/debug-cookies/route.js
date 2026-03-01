export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') ?? '(none)';
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookies = cookies.filter(c => c.includes('sb-') || c.includes('auth'));
  return Response.json({
    allCookieNames: cookies.map(c => c.split('=')[0].trim()),
    authRelated: authCookies.map(c => c.split('=')[0].trim()),
    hasAuthTokenDot: cookieHeader.includes('-auth-token.'),
    hasAuthTokenEquals: cookieHeader.includes('-auth-token='),
    hasCodeVerifier: cookieHeader.includes('code-verifier'),
    raw: cookieHeader.slice(0, 500),
  });
}
