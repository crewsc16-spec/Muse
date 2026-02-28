import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  }

  const wikimediaUrl =
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;

  try {
    const res = await fetch(wikimediaUrl, {
      headers: {
        'User-Agent': 'MuseApp/1.0 (contact: github.com/crewsc16-spec/Muse)',
        Accept: 'image/jpeg,image/png,image/*,*/*',
      },
      redirect: 'follow',
      next: { revalidate: 86400 }, // cache image for 24 h
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
