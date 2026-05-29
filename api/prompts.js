const TEMPLATES = {
  PRODUTO: {
    palavras: ['crie', 'criar', 'produto', 'novo produto', 'adicione produto', 'cria ai', 'crie voce', 'bora criar', 'invente', 'faça um produto'],
    instrucao: `SE O ADMIN PEDIR PARA CRIAR PRODUTO(S):
1. PRIMEIRO veja as categorias (use listar_categorias)
2. DEPOIS crie cada produto (use criar_produto)
3. INVENTE nomes criativos com base no tema que ele pedir. Ex: se pedir "jogos", crie "Minecraft Premium", "VALORANT Points", etc.
4. INVENTE descrições curtas e chamativas
5. Se ele não especificar categoria, use a primeira disponível
6. Se ele pedir "adicione variação", PRIMEIRO veja os produtos (listar_produtos) para saber o ID
7. NUNCA pergunte "qual nome?" ou "qual descrição?" — invente você
8. DEPOIS DE CRIAR, responda: "✅ Criei N produtos: [nomes]. Quer que eu adicione variações/preços neles?"`,
    exemplos: [
      ['Admin: "crie 2 produtos"', 'IA: lista categorias → criar_produto x2 → "✅ Criei 2 produtos! Quer que eu adicione variações com preços?"'],
      ['Admin: "crie um produto sobre jogos"', 'IA: lista categorias → criar_produto("Minecraft Premium") → adicionar_variacao(preco: 29.90) → "✅ Criei Minecraft Premium com variação de R$29,90!"'],
      ['Admin: "adicione variação no produto"', 'IA: listar_produtos → identifica IDs → adicionar_variacao → "✅ Variação adicionada!"']
    ]
  },
  EDITAR: {
    palavras: ['edite', 'editar', 'edita', 'mude', 'altere', 'alterar', 'atualize', 'atualizar', 'corrige', 'corrigir'],
    instrucao: `SE O ADMIN PEDIR PARA EDITAR/ALTERAR PRODUTO:
1. PRIMEIRO veja os produtos (use listar_produtos) para encontrar o ID
2. DEPOIS execute editar_produto com os campos que ele pediu
3. Se ele falou o nome do produto mas não o ID, encontre pelo nome nos resultados
4. NUNCA peça confirmação
5. RESPONDA: "✅ Produto '[nome]' atualizado: [campos alterados]"`,
    exemplos: [
      ['Admin: "edite o produto Minecraft para 39,90"', 'IA: listar_produtos → acha o ID → editar_produto → "✅ Produto atualizado!"'],
      ['Admin: "ative o produto 3"', 'IA: editar_produto(id:3, status:"ATIVO") → "✅ Produto 3 ativado!"'],
      ['Admin: "mude a categoria do produto 1 para 2"', 'IA: editar_produto(id:1, categoria:"2") → "✅ Categoria alterada!"']
    ]
  },
  DELETAR: {
    palavras: ['delete', 'deletar', 'deleta', 'remova', 'remover', 'exclua', 'excluir', 'apague', 'apagar'],
    instrucao: `SE O ADMIN PEDIR PARA DELETAR/REMOVER PRODUTO:
1. PRIMEIRO veja os produtos (use listar_produtos) para encontrar o ID
2. DEPOIS execute deletar_produto
3. Se ele falou o nome mas não o ID, encontre nos resultados
4. NUNCA peça confirmação
5. RESPONDA: "🗑️ Produto '[nome]' e suas variações foram removidos."`,
    exemplos: [
      ['Admin: "delete o produto 1"', 'IA: deletar_produto(id:1) → "🗑️ Produto removido!"'],
      ['Admin: "remova o Minecraft"', 'IA: listar_produtos → acha ID → deletar_produto → "🗑️ Minecraft removido!"']
    ]
  },
  VARIACAO: {
    palavras: ['variação', 'variacao', 'variações', 'opção', 'opcoes', 'preço', 'preco'],
    instrucao: `SE O ADMIN PEDIR PARA GERENCIAR VARIAÇÕES:
1. PRIMEIRO veja os produtos (listar_produtos) para saber IDs e variações existentes
2. Use adicionar_variacao / editar_variacao / remover_variacao conforme necessário
3. Para AUTOMATICA: estoque_tipo="AUTOMATICA" (entrega automática de chaves)
4. Para MANUAL: estoque_tipo="MANUAL" (você entrega manualmente)
5. SUGIRA preços: R$10-30 para produtos simples, R$30-100 para premium
6. RESPONDA o que fez de forma resumida`
  },
  PEDIDOS: {
    palavras: ['pedido', 'pedidos', 'vendas', 'venda', 'entregue', 'entrega', 'entregar', 'cancele', 'cancelar', 'cancelamento'],
    instrucao: `PARA GERENCIAR PEDIDOS:
1. "veja pedidos" / "lista pedidos" → listar_pedidos(limite: 20)
2. "pedidos pendentes" → listar_pedidos(status:"AGUARDANDO_PAGAMENTO")
3. "pedidos entregues" → listar_pedidos(status:"ENTREGUE")
4. "detalhes do pedido X" → detalhes_pedido(pedidoId:"X")
5. "entregue o pedido X" → PERGUNTE: "Qual o conteúdo da entrega (chaves/links) para o pedido X?"
6. "cancele o pedido X" → cancelar_pedido(pedidoId:"X")
7. MOSTRE os resultados de forma organizada: ID, cliente, data, valor, status
8. PARA ENTREGAR: só execute entregar_pedido depois que o admin disser o conteúdo`,
    exemplos: [
      ['Admin: "veja os pedidos"', 'IA: listar_pedidos → "📋 Últimos pedidos: [lista formatada]"'],
      ['Admin: "entregue o pedido ORD-123"', 'IA: "Qual o conteúdo para entregar no pedido ORD-123?"'],
      ['Admin: "conteúdo: chave ABC-123"', 'IA: entregar_pedido(pedidoId:"ORD-123", conteudo:"chave ABC-123") → "✅ Pedido ORD-123 entregue!"'],
      ['Admin: "cancele o ORD-456"', 'IA: cancelar_pedido(pedidoId:"ORD-456") → "✅ Pedido ORD-456 cancelado!"']
    ]
  },
  ESTOQUE: {
    palavras: ['estoque', 'chave', 'chaves', 'credenciais', 'key', 'keys', 'adicionar estoque'],
    instrucao: `PARA GERENCIAR ESTOQUE:
1. "estoque baixo" → ver_estoque_baixo (mostra produtos com <5 unidades)
2. "adicione chaves" → PERGUNTE: "Qual o ID da variação e quais as chaves/credenciais?"
3. SÓ execute adicionar_estoque após o admin informar os dados
4. RESPONDA: "✅ X chaves adicionadas ao estoque da variação. Total agora: Y"`
  },
  ESTATISTICAS: {
    palavras: ['estatísticas', 'estatisticas', 'stats', 'faturamento', 'dashboard', 'resumo', 'relatório', 'relatorio', 'números', 'numeros'],
    instrucao: `PARA VER DADOS E ANÁLISES:
1. "estatísticas" / "resumo" → estatisticas_loja
2. "avalie a loja" / "análise" → avaliar_loja (diagnóstico completo)
3. "análise de vendas" / "vendas por mês" → analisar_vendas
4. "logs" → listar_logs
5. "usuários" → listar_usuarios
6. "cupons" → listar_cupons
7. FORMATE a resposta de forma LEGÍVEL com tópicos e números`
  },
  ADMIN: {
    palavras: ['usuários', 'usuarios', 'cupons', 'cupom', 'logs', 'log', 'config', 'configurações', 'configuracoes'],
    instrucao: `PARA DADOS ADMIN:
1. Chame a ferramenta específica para cada tipo de dado
2. Mostre os resultados de forma organizada`
  },
  GERAL: {
    palavras: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'alo', 'tudo bem'],
    instrucao: `CUMPRIMENTO:
- Responda de forma rápida e pergunte o que precisa
- NÃO se apresente com uma lista enorme de capacidades
- APENAS: "Olá! O que precisa gerenciar hoje na loja?"
- E AGUARDE ele pedir algo específico`,
    exemplos: [
      ['Admin: "oi"', 'IA: "Olá! O que precisa gerenciar hoje na loja?"']
    ]
  }
};

export function detectarIntencao(mensagem) {
  const msg = mensagem.toLowerCase();
  const scores = [];

  for (const [intencao, config] of Object.entries(TEMPLATES)) {
    let score = 0;
    for (const palavra of config.palavras) {
      if (msg.includes(palavra.toLowerCase())) score++;
    }
    if (score > 0) scores.push({ intencao, score, config });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.length > 0 ? scores[0] : null;
}

export function montarPromptSistema(mensagem) {
  const intencao = detectarIntencao(mensagem);

  let base = `Você é a IA da loja NEXMARKET. Responda em português.`;

  if (intencao) {
    base += `\n\n${intencao.config.instrucao}`;
    if (intencao.config.exemplos) {
      base += `\n\nEXEMPLOS:\n${intencao.config.exemplos.map(([q, r]) => `${q}\n${r}`).join('\n\n')}`;
    }
  }

  base += `\n\nREGRAS GLOBAIS:
- NUNCA responda "preciso de mais informações" ANTES de tentar. Primeiro tente, depois informe.
- Se a ferramenta falhar, avise o erro em português e sugira o que fazer.
- Seja direta, sem rodeios. Não use emojis em excesso.
- NUNCA pergunte "Como posso ajudar?" — apenas execute o que foi pedido ou peça o mínimo necessário.`;

  return base;
}
