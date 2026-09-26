const getEnv = (name) => process.env[name] || globalThis.Netlify?.env?.get?.(name);

export default async (request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  const apiKey = getEnv('OPENAI_API_KEY');
  if (!apiKey) return Response.json({ error: 'The parlor is not connected yet.' }, { status: 503 });

  try {
    const body = await request.json();
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 280) : '';
    const intention = typeof body.intention === 'string' ? body.intention.trim().slice(0, 80) : '';
    const history = Array.isArray(body.history) ? body.history.slice(-6).map((item) => ({
      question: String(item?.question || '').slice(0, 280),
      answer: String(item?.answer || '').slice(0, 80)
    })) : [];
    if (!question) return Response.json({ error: 'Ask the board a question first.' }, { status: 400 });

    const context = history.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n');
    const prompt = `Session intention: ${intention || 'Open session'}\nPrevious exchange:\n${context || 'None'}\nNew question: ${question}`;
    const instructions = 'Generate one concise message for a clearly fictional Ouija-style interactive story. Output only 6 to 18 plain words using letters, numbers, spaces, apostrophes, question marks, or periods. Write a complete, eerie, poetic message that responds to the question rather than a tarot interpretation. Never claim actual spirit contact or factual supernatural knowledge. Do not reinforce paranoia, delusions, stalking, curses, possession, threats, or certainty about another person\'s thoughts. Never give medical, legal, financial, self-harm, or dangerous instructions. If the question is high-stakes or fear-driven, answer with a grounding phrase such as LOOK FOR CLARITY AMONG THE LIVING.';
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: getEnv('OPENAI_MODEL') || 'gpt-5-mini',
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500
      })
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error('OpenAI Ouija error', apiResponse.status, data?.error?.code || 'unknown');
      return Response.json({ error: 'The connection went quiet. Please try again shortly.' }, { status: 502 });
    }
    const content = data.choices?.[0]?.message?.content;
    const responseText = typeof content === 'string'
      ? content
      : Array.isArray(content) ? content.map((item) => item?.text || '').join(' ') : '';
    let message = responseText.trim().toUpperCase();
    message = message.replace(/[^A-Z0-9 '.?]/g, '').replace(/\s+/g, ' ').slice(0, 160);
    if (!message) return Response.json({ error: 'The board fell still. Ask again.' }, { status: 502 });
    return Response.json({ message }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Ouija function error', error?.message || error);
    return Response.json({ error: 'The session could not continue. Please try again.' }, { status: 500 });
  }
};
