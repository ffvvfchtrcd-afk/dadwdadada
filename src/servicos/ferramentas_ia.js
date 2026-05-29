import { supabase } from '../configuracoes/supabase';

const FERRAMENTAS = [
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
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome do produto' },
          descricao: { type: 'string', description: 'Descrição detalhada' },
          categoriaId: { type: 'number', description: 'ID da categoria' },
          miniDesc: { type: 'string', description: 'Descrição curta' },
          bannerUrl: { type: 'string', description: 'URL da imagem' }
        },
        required: ['nome', 'categoriaId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'editar_produto',
      description: 'Edita um produto existente',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID do produto' },
          nome: { type: 'string' },
          descricao: { type: 'string' },
          miniDesc: { type: 'string' },
          bannerUrl: { type: 'string' },
          status: { type: 'string', enum: ['ATIVO', 'INATIVO'] }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deletar_produto',
      description: 'Remove um produto e suas variações permanentemente',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID do produto' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adicionar_variacao',
      description: 'Adiciona uma nova variação/opção de compra a um produto',
      parameters: {
        type: 'object',
        properties: {
          produtoId: { type: 'number', description: 'ID do produto' },
          nome: { type: 'string', description: 'Ex: 1 Mês, 1000 Robux' },
          preco: { type: 'number', description: 'Preço em R$' },
          estoque_tipo: { type: 'string', enum: ['AUTOMATICA', 'MANUAL'] },
          quantidadeStock: { type: 'number', description: 'Qtd em estoque (só para automática)' }
        },
        required: ['produtoId', 'nome', 'preco', 'estoque_tipo']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_categorias',
      description: 'Lista todas as categorias disponíveis',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_pedidos',
      description: 'Lista os pedidos recentes',
      parameters: {
        type: 'object',
        properties: {
          limite: { type: 'number', description: 'Máx de pedidos (padrão 10)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'estatisticas_loja',
      description: 'Retorna estatísticas da loja (faturamento, vendas, produtos)',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recomendar_ajuste_preco',
      description: 'Analisa preços e sugere ajustes com base no mercado',
      parameters: { type: 'object', properties: {} }
    }
  }
];

async function executar(nome, args) {
  switch (nome) {
    case 'listar_produtos': {
      const { data } = await supabase.from('products').select('*');
      const variacoes = await Promise.all((data || []).map(async p => {
        const { data: v } = await supabase.from('variacoes').select('*').eq('produtoId', p.id);
        return { ...p, variacoes: v || [] };
      }));
      return { sucesso: true, dados: variacoes };
    }
    case 'criar_produto': {
      const id = Date.now();
      const { error } = await supabase.from('products').insert([{
        id, nome: args.nome, descricao: args.descricao || '',
        miniDesc: args.miniDesc || '', bannerUrl: args.bannerUrl || '',
        categoria: String(args.categoriaId), status: 'ATIVO',
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      }]);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, dados: { id } };
    }
    case 'editar_produto': {
      const updates = {};
      if (args.nome) updates.nome = args.nome;
      if (args.descricao) updates.descricao = args.descricao;
      if (args.miniDesc) updates.miniDesc = args.miniDesc;
      if (args.bannerUrl) updates.bannerUrl = args.bannerUrl;
      if (args.status) updates.status = args.status;
      updates.dataAtualizacao = new Date().toISOString();
      const { error } = await supabase.from('products').update(updates).eq('id', args.id);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true };
    }
    case 'deletar_produto': {
      await supabase.from('variacoes').delete().eq('produtoId', args.id);
      const { error } = await supabase.from('products').delete().eq('id', args.id);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true };
    }
    case 'adicionar_variacao': {
      const varId = Date.now() + Math.floor(Math.random() * 1000);
      const { error } = await supabase.from('variacoes').insert([{
        id: String(varId), produtoId: args.produtoId, nome: args.nome,
        preco: args.preco, estoque_tipo: args.estoque_tipo,
        quantidadeStock: args.quantidadeStock || 0,
        stockData: args.estoque_tipo === 'AUTOMATICA' ? [] : [],
        status: 'ATIVO', dataAtualizacao: new Date().toISOString()
      }]);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true };
    }
    case 'listar_categorias': {
      const { data } = await supabase.from('categories').select('*').order('id');
      return { sucesso: true, dados: data || [] };
    }
    case 'listar_pedidos': {
      const { data } = await supabase.from('compras')
        .select('*').order('date', { ascending: false }).limit(args?.limite || 10);
      return { sucesso: true, dados: data || [] };
    }
    case 'estatisticas_loja': {
      const [compras, products, users] = await Promise.all([
        supabase.from('compras').select('total, status'),
        supabase.from('products').select('id'),
        supabase.from('users').select('id')
      ]);
      const vendas = compras.data || [];
      const faturamento = vendas.filter(c => ['ENTREGUE', 'PAGO', 'PROCESSANDO'].includes(c.status))
        .reduce((s, c) => s + (c.total || 0), 0);
      return { sucesso: true, dados: {
        produtos: (products.data || []).length,
        usuarios: (users.data || []).length,
        pedidos: vendas.length,
        faturamento: faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        pendentes: vendas.filter(c => c.status === 'AGUARDANDO_PAGAMENTO').length,
        entregues: vendas.filter(c => c.status === 'ENTREGUE').length
      }};
    }
    case 'recomendar_ajuste_preco': {
      const { data: produtos } = await supabase.from('products').select('*');
      const variacoes = await Promise.all((produtos || []).map(async p => {
        const { data: v } = await supabase.from('variacoes').select('*').eq('produtoId', p.id);
        return v || [];
      }));
      const todas = variacoes.flat();
      return { sucesso: true, dados: {
        total_produtos: produtos?.length || 0,
        precos: todas.map(v => ({ nome: v.nome, preco: v.preco, tipo: v.estoque_tipo })),
        sugestao: 'Analise os preços acima. Considere comparar com concorrentes e ajustar margens entre 30-70%.'
      }};
    }
    default:
      return { sucesso: false, erro: `Ferramenta "${nome}" desconhecida` };
  }
}

export const FerramentasIA = { FERRAMENTAS, executar };
