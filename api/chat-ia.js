const FERRAMENTAS = [
  { type: 'function', function: { name: 'listar_produtos', description: 'Lista todos os produtos com variações', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'criar_produto', description: 'Cria um novo produto', parameters: { type: 'object', properties: { nome: { type: 'string' }, descricao: { type: 'string' } }, required: ['nome'] } } },
  { type: 'function', function: { name: 'editar_produto', description: 'Edita um produto existente', parameters: { type: 'object', properties: { id: { type: 'number' }, nome: { type: 'string' }, descricao: { type: 'string' }, status: { type: 'string', enum: ['ATIVO', 'INATIVO'] } }, required: ['id'] } } },
  { type: 'function', function: { name: 'deletar_produto', description: 'Remove um produto e suas variações', parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'adicionar_variacao', description: 'Adiciona variação a um produto', parameters: { type: 'object', properties: { produtoId: { type: 'number' }, nome: { type: 'string' }, preco: { type: 'number' }, estoque_tipo: { type: 'string', enum: ['AUTOMATICA', 'MANUAL'] } }, required: ['produtoId', 'nome', 'preco', 'estoque_tipo'] } } },
  { type: 'function', function: { name: 'listar_categorias', description: 'Lista categorias', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'listar_pedidos', description: 'Lista pedidos recentes', parameters: { type: 'object', properties: { limite: { type: 'number' } } } } },
  { type: 'function', function: { name: 'estatisticas_loja', description: 'Estatísticas completas da loja', parameters: { type: 'object', properties: {} } } }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ role: 'assistant', content: '⚠️ Open Router não configurado.', tool_calls: null });
  }

  const { message, historico } = req.body;
  if (!message) return res.status(200).json({ error: 'Mensagem é obrigatória' });

  try {
    const body = JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é o assistente IA da loja NEXMARKET. Responda em português brasileiro.' },
        ...(historico || []),
        { role: 'user', content: message }
      ],
      tools: FERRAMENTAS,
      tool_choice: 'auto',
      max_tokens: 1024
    });

    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nexmarket.vercel.app'
      },
      body
    });

    const data = await orRes.json();

    if (!orRes.ok) {
      return res.status(200).json({
        role: 'assistant',
        content: `❌ Erro OpenRouter (${orRes.status}): ${data.error?.message || JSON.stringify(data).slice(0, 300)}`,
        tool_calls: null
      });
    }

    const choice = data.choices?.[0]?.message;
    if (choice?.tool_calls) {
      return res.status(200).json({
        role: 'assistant',
        content: choice.content || '',
        tool_calls: choice.tool_calls.map(t => ({
          id: t.id,
          name: t.function.name,
          args: JSON.parse(t.function.arguments || '{}')
        }))
      });
    }

    return res.status(200).json({ role: 'assistant', content: choice?.content || 'Sem resposta.', tool_calls: null });
  } catch (err) {
    return res.status(200).json({
      role: 'assistant',
      content: `❌ Erro interno: ${err.message} (${err.name})`,
      tool_calls: null
    });
  }
}
