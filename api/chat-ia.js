const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ role: 'assistant', content: '⚠️ Open Router não configurado.' });
    }

    const { message, historico } = req.body;
    if (!message) return res.status(200).json({ error: 'Mensagem é obrigatória' });

    const mensagens = [
      { role: 'system', content: 'Você é o assistente da loja NEXMARKET. Responda em português brasileiro.' },
      ...(historico || []),
      { role: 'user', content: message }
    ];

    const response = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:5173'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: mensagens,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(200).json({ role: 'assistant', content: `❌ Erro Open Router: ${data.error?.message || response.status}` });
    }

    return res.status(200).json({
      role: 'assistant',
      content: data.choices?.[0]?.message?.content || 'Sem resposta.'
    });
  } catch (err) {
    return res.status(200).json({ role: 'assistant', content: `❌ Erro: ${err.message}` });
  }
};
