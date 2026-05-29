const FERRAMENTAS = [
  { type: 'function', function: { name: 'listar_produtos', description: 'Lista todos os produtos com variações', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'criar_produto', description: 'Cria um novo produto. Se o admin não especificar categoria, use padrão.', parameters: { type: 'object', properties: { nome: { type: 'string' }, descricao: { type: 'string' }, miniDesc: { type: 'string' }, bannerUrl: { type: 'string' }, categoria: { type: 'string', description: 'ID da categoria como string' } }, required: ['nome'] } } },
  { type: 'function', function: { name: 'editar_produto', description: 'Edita um produto existente', parameters: { type: 'object', properties: { id: { type: 'number' }, nome: { type: 'string' }, descricao: { type: 'string' }, status: { type: 'string', enum: ['ATIVO', 'INATIVO'] } }, required: ['id'] } } },
  { type: 'function', function: { name: 'deletar_produto', description: 'Remove um produto e suas variações', parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'adicionar_variacao', description: 'Adiciona variação a um produto', parameters: { type: 'object', properties: { produtoId: { type: 'number' }, nome: { type: 'string' }, preco: { type: 'number' }, estoque_tipo: { type: 'string', enum: ['AUTOMATICA', 'MANUAL'] }, quantidadeStock: { type: 'number', description: 'Qtd em estoque (só para automática)' } }, required: ['produtoId', 'nome', 'preco', 'estoque_tipo'] } } },
  { type: 'function', function: { name: 'listar_categorias', description: 'Lista categorias', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'listar_pedidos', description: 'Lista pedidos recentes. Filtra por status se informado (ex: AGUARDANDO_PAGAMENTO, PENDENTE, ENTREGUE).', parameters: { type: 'object', properties: { limite: { type: 'number' }, status: { type: 'string', description: 'Filtrar por status do pedido' } } } } },
  { type: 'function', function: { name: 'estatisticas_loja', description: 'Estatísticas completas da loja', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'entregar_pedido', description: 'Marca um pedido como ENTREGUE. SÓ use após o admin informar o conteúdo a ser entregue.', parameters: { type: 'object', properties: { pedidoId: { type: 'string' }, conteudo: { type: 'string', description: 'Conteúdo da entrega (chaves, links, acessos, etc). Obrigatório.' } }, required: ['pedidoId', 'conteudo'] } } }
];

const CHAVES = (process.env.OPEN_ROUTER_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
const MODELO = process.env.OPEN_ROUTER_MODEL || 'openrouter/free';

async function fetchOpenRouter(chave, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chave}`,
        'HTTP-Referer': 'https://nexmarket.vercel.app'
      },
      body,
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (CHAVES.length === 0) {
    return res.status(200).json({ role: 'assistant', content: '⚠️ Open Router não configurado. Adicione OPEN_ROUTER_API_KEY nas env vars.', tool_calls: null });
  }

  const { message, historico } = req.body;
  if (!message) return res.status(200).json({ error: 'Mensagem é obrigatória' });

  const body = JSON.stringify({
    model: MODELO,
    messages: [
      { role: 'system', content: `Você é a IA da loja NEXMARKET. Siga estas regras SEMPRE:

1. AÇÃO AUTÔNOMA — Se o admin disser "crie", "faça", "crie voce", "cria ai", "bora criar" ou similar:
   - Liste as categorias primeiro (use listar_categorias)
   - Crie os produtos IMEDIATAMENTE com nomes criativos e descrições curtas
   - NÃO pergunte nomes, descrições ou detalhes — invente você mesma
   - Depois de criar, responda o que criou e pergunte se quer ajustar

2. EDITAR/DELETAR — Se ele pedir pra editar ou deletar algo:
   - Liste os produtos primeiro (use listar_produtos)
   - Execute a ação sem ficar confirmando
   - Apenas informe o resultado

3. PEDIDOS — "ver pedidos", "entregar pedidos":
   - Use listar_pedidos para mostrar
   - Se ele pedir pra entregar, PEÇA: qual pedido (ID/email) e o conteúdo (chaves/acessos)
   - Só execute entregar_pedido após ele confirmar ambos

4. ERRO — Se uma ferramenta falhar, mostre a mensagem de erro em português e sugira o que fazer

5. TOM — Objetivo, direto, sem rodeios. Não peça desculpas.` },
      ...(historico || []),
      { role: 'user', content: message }
    ],
    tools: FERRAMENTAS,
    tool_choice: 'auto',
    max_tokens: 1024
  });

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    for (let i = 0; i < CHAVES.length; i++) {
      try {
        const orRes = await fetchOpenRouter(CHAVES[i], body);
        const data = await orRes.json();

        if (orRes.status === 402) {
          if (i === CHAVES.length - 1) {
            return res.status(200).json({ role: 'assistant', content: '❌ Saldo insuficiente no OpenRouter. Adicione créditos ou troque a chave.', tool_calls: null });
          }
          continue;
        }
        if (orRes.status === 429) {
          if (i === CHAVES.length - 1) {
            return res.status(200).json({ role: 'assistant', content: '❌ Muitas requisições. Aguarde um momento e tente novamente.', tool_calls: null });
          }
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        if (!orRes.ok) {
          const msg = data.error?.message || '';
          if (orRes.status === 404) {
            return res.status(200).json({ role: 'assistant', content: `⚠️ Modelo temporariamente indisponível. Tente novamente em instantes.`, tool_calls: null });
          }
          return res.status(200).json({ role: 'assistant', content: `❌ Erro (${orRes.status}): ${msg}`, tool_calls: null });
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
        if (i === CHAVES.length - 1 && tentativa === 2) {
          return res.status(200).json({ role: 'assistant', content: `❌ Erro: ${err.message}`, tool_calls: null });
        }
      }
    }
  }

  return res.status(200).json({ role: 'assistant', content: '❌ Todas as tentativas esgotadas. Tente novamente mais tarde.', tool_calls: null });
}
