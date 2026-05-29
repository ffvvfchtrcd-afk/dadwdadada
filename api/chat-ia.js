import { montarPromptSistema } from './prompts.js';

const FERRAMENTAS = [
  { type: 'function', function: { name: 'listar_produtos', description: 'Lista todos os produtos com variações e estoque', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'criar_produto', description: 'Cria um novo produto. Se não especificar categoria, usa a primeira.', parameters: { type: 'object', properties: { nome: { type: 'string' }, descricao: { type: 'string' }, miniDesc: { type: 'string' }, bannerUrl: { type: 'string' }, categoria: { type: 'string' } }, required: ['nome'] } } },
  { type: 'function', function: { name: 'editar_produto', description: 'Edita um produto (nome, descricao, categoria, status)', parameters: { type: 'object', properties: { id: { type: 'number' }, nome: { type: 'string' }, descricao: { type: 'string' }, miniDesc: { type: 'string' }, bannerUrl: { type: 'string' }, categoria: { type: 'string' }, status: { type: 'string', enum: ['ATIVO', 'INATIVO'] } }, required: ['id'] } } },
  { type: 'function', function: { name: 'deletar_produto', description: 'Remove produto + variações', parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'adicionar_variacao', description: 'Adiciona variação a um produto. Se não informar quantidadeStock, será 0.', parameters: { type: 'object', properties: { produtoId: { type: 'number' }, nome: { type: 'string' }, preco: { type: 'number' }, estoque_tipo: { type: 'string', enum: ['AUTOMATICA', 'MANUAL'] }, quantidadeStock: { type: 'number' } }, required: ['produtoId', 'nome', 'preco', 'estoque_tipo'] } } },
  { type: 'function', function: { name: 'editar_variacao', description: 'Edita nome/preço/estoque de uma variação', parameters: { type: 'object', properties: { id: { type: 'string' }, nome: { type: 'string' }, preco: { type: 'number' }, quantidadeStock: { type: 'number' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'remover_variacao', description: 'Remove uma variação', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'listar_categorias', description: 'Lista todas as categorias disponíveis para vincular produtos', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'criar_categoria', description: 'Cria uma nova categoria', parameters: { type: 'object', properties: { nome: { type: 'string' } }, required: ['nome'] } } },
  { type: 'function', function: { name: 'listar_pedidos', description: 'Lista pedidos. Filtra por status (PENDENTE, PAGO, AGUARDANDO_PAGAMENTO, ENTREGUE, CANCELADO)', parameters: { type: 'object', properties: { limite: { type: 'number' }, status: { type: 'string', enum: ['PENDENTE', 'PAGO', 'AGUARDANDO_PAGAMENTO', 'ENTREGUE', 'CANCELADO'] } } } } },
  { type: 'function', function: { name: 'detalhes_pedido', description: 'Mostra detalhes completos de um pedido (itens, cliente, timeline, status)', parameters: { type: 'object', properties: { pedidoId: { type: 'string' } }, required: ['pedidoId'] } } },
  { type: 'function', function: { name: 'entregar_pedido', description: 'Marca pedido como ENTREGUE e registra o conteúdo da entrega', parameters: { type: 'object', properties: { pedidoId: { type: 'string' }, conteudo: { type: 'string' } }, required: ['pedidoId', 'conteudo'] } } },
  { type: 'function', function: { name: 'cancelar_pedido', description: 'Cancela um pedido (só funciona se não estiver entregue)', parameters: { type: 'object', properties: { pedidoId: { type: 'string' } }, required: ['pedidoId'] } } },
  { type: 'function', function: { name: 'adicionar_estoque', description: 'Adiciona chaves/credenciais ao estoque de uma variação automática', parameters: { type: 'object', properties: { variacaoId: { type: 'string' }, chaves: { type: 'string', description: 'Chaves/credenciais, uma por linha' } }, required: ['variacaoId', 'chaves'] } } },
  { type: 'function', function: { name: 'listar_usuarios', description: 'Lista usuários cadastrados com total gasto por cada um', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'listar_cupons', description: 'Lista cupons de desconto cadastrados', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'listar_logs', description: 'Mostra logs recentes do sistema', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'ver_estoque_baixo', description: 'Mostra variações com estoque abaixo de 5 unidades', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'estatisticas_loja', description: 'Estatísticas gerais: faturamento, total de produtos, pedidos, usuários', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'avaliar_loja', description: 'Diagnóstico completo da loja com sugestões de melhoria', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'analisar_vendas', description: 'Análise detalhada de vendas: faturamento, pedidos por status, receita por mês', parameters: { type: 'object', properties: {} } } }
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
    return res.status(200).json({ role: 'assistant', content: '⚠️ Open Router não configurado.', tool_calls: null });
  }

  const { message, historico } = req.body;
  if (!message) return res.status(200).json({ error: 'Mensagem é obrigatória' });

  const systemPrompt = montarPromptSistema(message);

  const body = JSON.stringify({
    model: MODELO,
    messages: [
      { role: 'system', content: systemPrompt },
      ...(historico || []),
      { role: 'user', content: message }
    ],
    tools: FERRAMENTAS,
    tool_choice: 'auto',
    max_tokens: 2048
  });

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    for (let i = 0; i < CHAVES.length; i++) {
      try {
        const orRes = await fetchOpenRouter(CHAVES[i], body);
        const data = await orRes.json();

        if (orRes.status === 402) { if (i === CHAVES.length - 1) return res.status(200).json({ role: 'assistant', content: '❌ Saldo insuficiente no OpenRouter.', tool_calls: null }); continue; }
        if (orRes.status === 429) { if (i === CHAVES.length - 1) return res.status(200).json({ role: 'assistant', content: '❌ Muitas requisições. Aguarde.', tool_calls: null }); await new Promise(r => setTimeout(r, 2000)); continue; }
        if (!orRes.ok) { if (orRes.status === 404) return res.status(200).json({ role: 'assistant', content: '⚠️ Modelo indisponível.', tool_calls: null }); return res.status(200).json({ role: 'assistant', content: `❌ Erro (${orRes.status})`, tool_calls: null }); }

        const choice = data.choices?.[0]?.message;
        if (choice?.tool_calls) {
          return res.status(200).json({
            role: 'assistant',
            content: choice.content || '',
            tool_calls: choice.tool_calls.map(t => ({
              id: t.id, name: t.function.name, args: JSON.parse(t.function.arguments || '{}')
            }))
          });
        }
        return res.status(200).json({ role: 'assistant', content: choice?.content || 'Sem resposta.', tool_calls: null });
      } catch (err) {
        if (i === CHAVES.length - 1 && tentativa === 2) return res.status(200).json({ role: 'assistant', content: `❌ Erro: ${err.message}`, tool_calls: null });
      }
    }
  }
  return res.status(200).json({ role: 'assistant', content: '❌ Todas tentativas esgotadas.', tool_calls: null });
}
