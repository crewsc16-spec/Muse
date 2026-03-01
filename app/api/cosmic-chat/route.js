export async function POST(request) {
  const { question, chartSummary } = await request.json();
  if (!question?.trim()) {
    return new Response('Missing question', { status: 400 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response('Not configured', { status: 503 });

  const systemPrompt = `You are a warm, insightful guide specialising in Human Design, astrology, and numerology.
The user is asking about their personal chart. Use only the chart data provided — do not invent details.
Answer conversationally, with warmth and depth. Keep responses to 2–4 paragraphs unless more is genuinely needed.
Reference specific gates, channels, signs, or numbers when relevant. Do not use jargon without briefly explaining it.

${chartSummary}`;

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!anthropicRes.ok) {
    return new Response('Upstream error', { status: 502 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); break; }
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                controller.enqueue(new TextEncoder().encode(data.delta.text));
              }
            } catch {}
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
