import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const orientation = searchParams.get('orientation') ?? 'landscape';

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Unsplash not configured' }, { status: 503 });
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=18&orientation=${orientation}`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Unsplash request failed' }, { status: res.status });
  }

  const json = await res.json();
  const photos = json.results.map(p => ({
    id: p.id,
    thumb: p.urls.thumb,
    regular: p.urls.regular,
    alt: p.alt_description ?? p.description ?? 'Photo',
    photographer: p.user.name,
    photographerUrl: p.user.links.html,
  }));

  return NextResponse.json({ photos });
}
