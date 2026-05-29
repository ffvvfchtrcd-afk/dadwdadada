export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      role: 'assistant',
      content: '⚠️ **Open Router não configurado.**\n\nDefina `OPEN_ROUTER_API_KEY` nas variáveis de ambiente da Vercel (ou no `.env` local).\n\nChave: `' + process.env.OPEN_ROUTER_API_KEY?.substring(0, 8) + '...`'
    });
  }

  const { message, context } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória' });
  }

  const systemPrompt = `Você é o assistente IA da loja **${context?.nomeLoja || 'NEXMARKET'}**, uma loja digital que vende acessos e chaves (Streaming, Jogos, Software, Redes Sociais).

Você pode:
- **Gerar descrições criativas** de produtos e variações
- **Criar textos promocionais** e anúncios para redes sociais
- **Dar dicas de vendas**, marketing e posicionamento
- **Analisar resultados** e sugerir melhorias
- **Ajudar com respostas** para clientes

Seja direto, prático e em **português brasileiro**. Use markdown quando ajudar.
**Dados da loja:** ${context?.produtosCount || 0} produtos, ${context?.pedidosCount || 0} pedidos, ${context?.faturamento || 'R$ 0'} em vendas.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:5173'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        role: 'assistant',
        content: `❌ **Erro na Open Router:** ${data.error?.message || data.message || 'Erro desconhecido'}`
      });
    }

    res.json({
      role: 'assistant',
      content: data.choices?.[0]?.message?.content || 'Sem resposta.'
    });
  } catch (err) {
    res.status(200).json({
      role: 'assistant',
      content: `❌ **Erro de conexão:** ${err.message}`
    });
  }
}
