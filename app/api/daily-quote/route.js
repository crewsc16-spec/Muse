import { NextResponse } from 'next/server';

export async function POST(request) {
  const { picks } = await request.json();
  if (!picks?.length) return NextResponse.json({ quotes: [] });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const prompt = picks.map(p => `${p.category.toUpperCase()}: "${p.title}"`).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `For each item below, return one short memorable quote, line, or lyric from it. Only use real quotes that actually exist in the work. Reply ONLY with a JSON array: [{"category":"...","title":"...","quote":"...","attribution":"..."}]\n\n${prompt}`,
      }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '[]';
  const match = text.match(/\[[\s\S]*\]/);
  const quotes = match ? JSON.parse(match[0]) : [];
  return NextResponse.json({ quotes });
}
