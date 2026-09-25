const majorArcana = ['The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged One','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World'];
const suits = ['Wands','Cups','Swords','Pentacles'];
const ranks = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
const allowedCards = new Set([...majorArcana, ...suits.flatMap((suit) => ranks.map((rank) => `${rank} of ${suit}`))]);

const getEnv = (name) => process.env[name] || globalThis.Netlify?.env?.get?.(name);

export default async (request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  const apiKey = getEnv('OPENAI_API_KEY');
  if (!apiKey) return Response.json({ error: 'The reading room is not connected yet.' }, { status: 503 });

  try {
    const body = await request.json();
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 300) : '';
    const cards = Array.isArray(body.cards) ? body.cards.slice(0, 3) : [];
    const valid = (cards.length === 1 || cards.length === 3) && cards.every((card) =>
      allowedCards.has(card?.name) && ['Upright', 'Reversed'].includes(card?.orientation) && typeof card?.position === 'string'
    );
    if (!valid) return Response.json({ error: 'Those cards could not be read. Please draw again.' }, { status: 400 });

    const cardList = cards.map((card) => `${card.position}: ${card.name} — ${card.orientation}`).join('\n');
    const prompt = `Visitor question: ${question || 'No question; give an open reading.'}\n\nCards drawn:\n${cardList}`;
    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: getEnv('OPENAI_MODEL') || 'gpt-5-mini',
        instructions: 'You are the voice of Rogue Rose Tarot: perceptive, mysterious, compassionate, and grounded. Interpret only the supplied cards, positions, orientations, and question. Write a cohesive reading in 3 to 5 short paragraphs, around 250 to 400 words. Address the visitor as you. Be specific without claiming supernatural certainty. Never intensify paranoia, delusions, fear of spirits, or certainty about another person\'s private thoughts. Do not provide medical, legal, financial, or crisis directives. For high-stakes topics, gently frame the cards as reflection and encourage appropriate real-world support. Do not add headings, bullet points, markdown, or a disclaimer; the page already shows one.',
        input: prompt,
        max_output_tokens: 700
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error('OpenAI response error', apiResponse.status, data?.error?.code || 'unknown');
      return Response.json({ error: 'The connection went quiet. Please try again shortly.' }, { status: 502 });
    }
    const reading = (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('\n').trim();
    if (!reading) return Response.json({ error: 'The cards fell silent. Please try another draw.' }, { status: 502 });
    return Response.json({ reading }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Tarot function error', error?.message || error);
    return Response.json({ error: 'The reading could not be completed. Please try again.' }, { status: 500 });
  }
};
