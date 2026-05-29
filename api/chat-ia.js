import { montarPromptSistema } from './prompts.js';

const FERRAMENTAS = [
  { type: 'function', function: { name: 'listar_produtos', description: 'Lista todos os produtos com variações e estoque', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'criar_produto', description: 'Cria um novo produto. Se não especificar categoria, usa a primeira.', parameters: { type: 'object', properties: { nome: { type: 'string' }, descricao: { type: 'string' }, miniDesc: { type: 'string' }, bannerUrl: { type: 'string' }, categoria: { type: 'string' } }, required: ['nome'] } } },
  { type: 'function', function: { name: 'editar_produto', description: 'Edita um produto (nome, descricao, categoria, status)', parameters: { type: 'object', properties: { id: { type: 'number' }, nome: { type: 'string' }, descricao: { type: 'string' }, miniDesc: { type: 'string' }, bannerUrl: { type: 'string' }, categoria: { type: 'string' }, status: { type: 'string', enum: ['ATIVO', 'INATIVO'] } }, required: ['id'] } } },
  { type: 'function', function: { name: 'deletar_produto', description: 'Remove produto + variações', parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'adicionar_variacao', description: 'Adiciona variação a um produto. Se não informar quantidadeStock, será 0.', parameters: { type: 'object', properties: { produtoId: { type: 'number' }, nome: { type: 'string' }, preco: { type: 'number' }, estoque_tipo: { type: 'string', enum: ['AUTOMATICA', 'MANUAL'] }, quantidadeStock: { type: 'number' } }, required: ['produtoId', 'nome', 'preco', 'estoque_tipo'] } } },
  { type: 'function', function: { name: 'editar_variacao', description: 'Edita nome/preço/estoque de uma variação', parameters: { type: 'object', properties: { id: { type: 'string' }, nome: { type: 'string' }, preco: { type: 'number' }, quantidadeStock: { type: 'number' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'remover_variacao', description: 'Remove uma variação', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'listar_categorias', description: 'Lista todas as categorias para vincular produtos', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'criar_categoria', description: 'Cria uma nova categoria', parameters: { type: 'object', properties: { nome: { type: 'string' } }, required: ['nome'] } } },
  { type: 'function', function: { name: 'listar_pedidos', description: 'Lista pedidos. Filtra por status (PENDENTE, PAGO, AGUARDANDO_PAGAMENTO, ENTREGUE, CANCELADO)', parameters: { type: 'object', properties: { limite: { type: 'number' }, status: { type: 'string', enum: ['PENDENTE', 'PAGO', 'AGUARDANDO_PAGAMENTO', 'ENTREGUE', 'CANCELADO'] } } } } },
  { type: 'function', function: { name: 'detalhes_pedido', description: 'Mostra detalhes completos de um pedido (itens, cliente, timeline, status)', parameters: { type: 'object', properties: { pedidoId: { type: 'string' } }, required: ['pedidoId'] } } },
  { type: 'function', function: { name: 'entregar_pedido', description: 'Marca pedido como ENTREGUE e registra o conteúdo', parameters: { type: 'object', properties: { pedidoId: { type: 'string' }, conteudo: { type: 'string' } }, required: ['pedidoId', 'conteudo'] } } },
  { type: 'function', function: { name: 'cancelar_pedido', description: 'Cancela um pedido (só se não estiver entregue)', parameters: { type: 'object', properties: { pedidoId: { type: 'string' } }, required: ['pedidoId'] } } },
  { type: 'function', function: { name: 'adicionar_estoque', description: 'Adiciona chaves/credenciais ao estoque de uma variação', parameters: { type: 'object', properties: { variacaoId: { type: 'string' }, chaves: { type: 'string', description: 'Uma por linha' } }, required: ['variacaoId', 'chaves'] } } },
  { type: 'function', function: { name: 'listar_usuarios', description: 'Lista usuários com total gasto', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'listar_cupons', description: 'Lista cupons de desconto', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'listar_logs', description: 'Logs recentes do sistema', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'ver_estoque_baixo', description: 'Variações com estoque < 5', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'estatisticas_loja', description: 'Faturamento, produtos, pedidos, usuários', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'avaliar_loja', description: 'Diagnóstico + sugestões de melhoria', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'analisar_vendas', description: 'Vendas: faturamento, status, receita por mês', parameters: { type: 'object', properties: {} } } }
];

const CHAVES = (process.env.OPEN_ROUTER_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
const MODELOS = (process.env.OPEN_ROUTER_MODEL || 'openrouter/free').split(',').map(m => m.trim()).filter(Boolean);

const FALLBACK_TEXTOS = {
  saudacao: [
    'Olá! O que precisa gerenciar hoje na loja?',
    'Fala! Tudo certo? O que vamos fazer hoje?'
  ],
  erro: '❌ A IA está temporariamente indisponível. Tente novamente em alguns instantes.'
};

async function fetchOpenRouter(chave, modelo, messages, tools) {
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
      body: JSON.stringify({
        model: modelo,
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 2048
      }),
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function respostaFallback(mensagem) {
  const m = mensagem.toLowerCase().trim();
  if (/^(oi|ola|olá|hey|bom dia|boa tarde|boa noite|alo|e ai|e aí|fala)/.test(m)) {
    return FALLBACK_TEXTOS.saudacao[Math.floor(Math.random() * FALLBACK_TEXTOS.saudacao.length)];
  }
  if (/^(tudo bem|blz|beleza|ok|obrigado|valeu|brigado)/.test(m)) {
    return 'Por nada! Quando precisar de algo na loja, é só chamar.';
  }
  return null;
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

  const fallback = respostaFallback(message);
  if (fallback && (!historico || historico.length === 0)) {
    return res.status(200).json({ role: 'assistant', content: fallback, tool_calls: null });
  }

  const systemPrompt = montarPromptSistema(message);

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    for (let mi = 0; mi < MODELOS.length; mi++) {
      for (let ci = 0; ci < CHAVES.length; ci++) {
        try {
          const messages = [
            { role: 'system', content: systemPrompt },
            ...(historico || []),
            { role: 'user', content: message }
          ];

          const orRes = await fetchOpenRouter(CHAVES[ci], MODELOS[mi], messages, FERRAMENTAS);
          const data = await orRes.json();

          if (orRes.status === 402 || orRes.status === 404) continue;
          if (orRes.status === 429) { await new Promise(r => setTimeout(r, 2000)); continue; }
          if (!orRes.ok) continue;

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
          return res.status(200).json({ role: 'assistant', content: choice?.content || 'OK.', tool_calls: null });
        } catch (err) {
          if (mi === MODELOS.length - 1 && ci === CHAVES.length - 1 && tentativa === 1) {
            const fb = respostaFallback(message);
            return res.status(200).json({ role: 'assistant', content: fb || FALLBACK_TEXTOS.erro, tool_calls: null });
          }
        }
      }
    }
  }
  return res.status(200).json({ role: 'assistant', content: FALLBACK_TEXTOS.erro, tool_calls: null });
}
