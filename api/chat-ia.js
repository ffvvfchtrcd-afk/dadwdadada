const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

const FERRAMENTAS_API = [
  {
    type: 'function',
    function: {
      name: 'listar_produtos',
      description: 'Lista todos os produtos da loja com suas variações e estoque',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'criar_produto',
      description: 'Cria um novo produto na loja',
      parameters: {
        type: 'object', properties: {
          nome: { type: 'string', description: 'Nome do produto' },
          descricao: { type: 'string' },
          miniDesc: { type: 'string' },
          bannerUrl: { type: 'string' }
        }, required: ['nome']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'editar_produto',
      description: 'Edita um produto existente',
      parameters: {
        type: 'object', properties: {
          id: { type: 'number' }, nome: { type: 'string' },
          descricao: { type: 'string' }, status: { type: 'string', enum: ['ATIVO', 'INATIVO'] }
        }, required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deletar_produto',
      description: 'Remove um produto e suas variações',
      parameters: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adicionar_variacao',
      description: 'Adiciona variação a um produto',
      parameters: {
        type: 'object', properties: {
          produtoId: { type: 'number' }, nome: { type: 'string' },
          preco: { type: 'number' }, estoque_tipo: { type: 'string', enum: ['AUTOMATICA', 'MANUAL'] },
          quantidadeStock: { type: 'number' }
        }, required: ['produtoId', 'nome', 'preco', 'estoque_tipo']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_categorias',
      description: 'Lista todas as categorias',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_pedidos',
      description: 'Lista pedidos recentes',
      parameters: { type: 'object', properties: { limite: { type: 'number' } } }
    }
  },
  {
    type: 'function',
    function: {
      name: 'estatisticas_loja',
      description: 'Estatísticas completas da loja',
      parameters: { type: 'object', properties: {} }
    }
  }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ role: 'assistant', content: '⚠️ Open Router não configurado. Defina OPEN_ROUTER_API_KEY nas env vars.', tool_calls: [] });
    }

    const { message, historico, context } = req.body;
    if (!message) return res.status(200).json({ error: 'Mensagem é obrigatória' });

    const systemPrompt = `Você é o assistente IA da loja **${context?.nomeLoja || 'NEXMARKET'}**, uma loja digital.

Você TEM acesso a ferramentas que permitem: listar, criar, editar e deletar produtos; gerenciar variações; ver pedidos e estatísticas.

**REGRAS IMPORTANTES:**
1. Quando o usuário pedir algo que você pode fazer com as ferramentas, USE a ferramenta — não apenas converse.
2. Sempre confirme com o usuário antes de DELETAR algo.
3. Responda em português brasileiro, de forma direta e prática.
4. Use as ferramentas sempre que possível para dar respostas com dados reais.

**Dados da loja:** ${context?.produtosCount || 0} produtos, ${context?.pedidosCount || 0} pedidos.`;

    const mensagens = [
      { role: 'system', content: systemPrompt },
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
        tools: FERRAMENTAS_API,
        tool_choice: 'auto',
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(200).json({ role: 'assistant', content: `❌ Erro: ${data.error?.message || 'Erro desconhecido'}`, tool_calls: [] });
    }

    const choice = data.choices?.[0];
    const msg = choice?.message;

    if (msg?.tool_calls) {
      return res.status(200).json({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.tool_calls.map(tc => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}')
        }))
      });
    }

    return res.status(200).json({
      role: 'assistant',
      content: msg?.content || 'Sem resposta.',
      tool_calls: []
    });
  } catch (err) {
    return res.status(200).json({ role: 'assistant', content: `❌ Erro: ${err.message}`, tool_calls: [] });
  }
};
