const RSS_URL = 'https://www.goodnewsnetwork.org/feed/';

let cache = { headlines: null, ts: 0 };
const TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (cache.headlines && Date.now() - cache.ts < TTL) {
    return Response.json({ headlines: cache.headlines });
  }

  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`
    );
    const data = await res.json();
    const headlines = (data.items ?? []).slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.description?.replace(/<[^>]*>/g, '').trim().slice(0, 150),
    }));

    cache = { headlines, ts: Date.now() };
    return Response.json({ headlines });
  } catch {
    return Response.json({ headlines: [] }, { status: 500 });
  }
}
