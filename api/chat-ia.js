export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ role: 'assistant', content: '⚠️ Open Router não configurado. Defina OPEN_ROUTER_API_KEY nas env vars.' });
  }

  const { message, historico } = req.body;
  if (!message) return res.status(200).json({ error: 'Mensagem é obrigatória' });

  try {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:5173'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é o assistente da loja NEXMARKET. Responda em português brasileiro, de forma direta e prática.' },
          ...(historico || []),
          { role: 'user', content: message }
        ],
        max_tokens: 1024
      })
    });

    const data = await orRes.json();
    if (!orRes.ok) {
      return res.status(200).json({ role: 'assistant', content: `❌ Erro na API: ${data.error?.message || 'Erro desconhecido'}` });
    }

    return res.status(200).json({
      role: 'assistant',
      content: data.choices?.[0]?.message?.content || 'Sem resposta.'
    });
  } catch (err) {
    return res.status(200).json({ role: 'assistant', content: `❌ Erro: ${err.message}` });
  }
}
