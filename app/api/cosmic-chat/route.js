export async function POST(request) {
  const { question, chartSummary } = await request.json();
  if (!question?.trim()) {
    return new Response('Missing question', { status: 400 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response('Not configured', { status: 503 });

  const systemPrompt = `You are a warm, witty, deeply knowledgeable guide who specialises in Human Design, astrology, and numerology. Think: wise best friend who also happens to know the cosmos inside out.

PERSONALITY:
- Be genuinely warm and human — talk like a real person, not a textbook.
- Use humor naturally. A well-placed joke, a playful observation, a bit of self-awareness. Don't force it, but don't be stiff either.
- When the question is light, keep it light. When it's deep or vulnerable, meet them there with real depth and care.
- You can be direct. You can be poetic. Match the energy of the question.

CONTENT RULES:
- Use only the chart data provided — do not invent placements or details.
- Lead with the insight, not the reference. The answer should feel like advice from someone who knows you, not a chart reading.
- Do NOT clutter the answer with gate numbers, degree symbols, or technical references inline. Keep the main response clean and human.
- After your answer, if specific chart placements informed your response, add a brief subtle reference line at the end starting with a ✦ (e.g. "✦ This comes from your Gate 51 in the Heart center + Moon in Scorpio").
- If the user specifically asks for technical details or references, go deep — list placements, explain mechanics, get nerdy.
- Keep responses to 2–4 paragraphs unless more is genuinely needed.

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
      max_tokens: 1000,
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
