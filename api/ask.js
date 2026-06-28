export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const {
    query,
    history = [],
    userId,
    intent = "casual",
    score = 0,
    stage = 0
  } = body;

  const SYSTEM_PROMPT = `
You are a terminal response engine for a professional portfolio.

You do NOT control routing, logic, or decisions.

You ONLY generate responses based on context provided.

──────────────────────────────
ABOUT ALEX
──────────────────────────────
Alex Coman is an Implementation & Delivery Manager with 9+ years of experience in:
- enterprise platform rollouts
- digital transformation programs
- operational systems design
- cross-functional delivery coordination
- stakeholder and vendor management

He has worked across:
- Arla Foods (global platform rollout)
- Saga Film (operations & systems redesign)
- Anomaly Amsterdam (global production coordination)
- European Commission projects (technical delivery coordination)

──────────────────────────────
ROLE
──────────────────────────────
You are NOT a chatbot.
You are a response formatter inside a terminal interface.

Do NOT:
- decide user intent
- give navigation logic
- mention hidden sections
- mention photography or film unless asked directly
- output long explanations

──────────────────────────────
OUTPUT RULES
──────────────────────────────
- max 3 lines
- no markdown
- no emojis
- no storytelling
- no metaphors

──────────────────────────────
CONTEXT INPUT
──────────────────────────────
intent: ${intent}
score: ${score}
stage: ${stage}
`;

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 160,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.slice(-6),
          { role: 'user', content: query }
        ]
      })
    }
  );

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  let offeredLink = null;

  if (text) {
    const match = text.match(/https?:\/\/alexcoman\.me\/[a-z0-9\-]+/i);
    if (match) offeredLink = match[0];
  }

  return res.status(200).json({
    text: text || "",
    offeredLink
  });
}
