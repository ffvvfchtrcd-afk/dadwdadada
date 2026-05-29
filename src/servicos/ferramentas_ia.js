import { supabase } from '../configuracoes/supabase';

function msgAmigavel(erro) {
  if (!erro) return 'Erro desconhecido';
  const e = String(erro).toLowerCase();
  if (e.includes('permission') || e.includes('policy') || e.includes('violate') || e.includes('not allowed')) return 'Sem permissão para realizar esta ação.';
  if (e.includes('duplicate') || e.includes('unique')) return 'Já existe um registro com esses dados.';
  if (e.includes('not found')) return 'Registro não encontrado.';
  if (e.includes('foreign key') || e.includes('violates foreign')) return 'Este registro está vinculado a outros dados.';
  if (e.includes('network') || e.includes('fetch')) return 'Erro de conexão. Verifique sua internet.';
  if (e.includes('timeout') || e.includes('timed out')) return 'A operação excedeu o tempo limite. Tente novamente.';
  return String(erro).slice(0, 200);
}

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
  try {
    switch (nome) {
      case 'listar_produtos': {
        const { data, error } = await supabase.from('products').select('*');
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        const { data: todasVariacoes } = await supabase.from('variacoes').select('*');
        const variacoes = (data || []).map(p => ({
          ...p,
          variacoes: (todasVariacoes || []).filter(v => v.produtoId === p.id || v.productId === p.id)
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
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
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
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true };
      }
      case 'deletar_produto': {
        const { data: vars } = await supabase.from('variacoes').select('id');
        const idsVar = (vars || []).filter(v => v.produtoId === args.id || v.productId === args.id).map(v => v.id);
        if (idsVar.length > 0) {
          const { error: e1 } = await supabase.from('variacoes').delete().in('id', idsVar);
          if (e1) return { sucesso: false, erro: msgAmigavel(e1.message) };
        }
        const { error } = await supabase.from('products').delete().eq('id', args.id);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
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
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true };
      }
      case 'listar_categorias': {
        const { data, error } = await supabase.from('categories').select('*').order('id');
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: data || [] };
      }
      case 'listar_pedidos': {
        const { data, error } = await supabase.from('compras').select('*').limit(args?.limite || 50);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        const ordenados = (data || []).sort((a, b) => {
          const da = a.dateCreated || a.DateCreated || 0;
          const db = b.dateCreated || b.DateCreated || 0;
          return new Date(db) - new Date(da);
        });
        return { sucesso: true, dados: ordenados.slice(0, args?.limite || 10) };
      }
      case 'estatisticas_loja': {
        const [compras, products, users] = await Promise.all([
          supabase.from('compras').select('total, status'),
          supabase.from('products').select('id'),
          supabase.from('users').select('id')
        ]);
        if (compras.error) return { sucesso: false, erro: msgAmigavel(compras.error.message) };
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
        const { data: produtos, error: e1 } = await supabase.from('products').select('*');
        if (e1) return { sucesso: false, erro: e1.message };
        const { data: todasV } = await supabase.from('variacoes').select('*');
        const todas = (todasV || []).filter(v => v.produtoId || v.productId);
        return { sucesso: true, dados: {
          total_produtos: produtos?.length || 0,
          precos: todas.map(v => ({ nome: v.nome, preco: v.preco, tipo: v.estoque_tipo })),
          sugestao: 'Analise os preços acima. Considere comparar com concorrentes e ajustar margens entre 30-70%.'
        }};
      }
      default:
        return { sucesso: false, erro: `Ferramenta "${nome}" desconhecida` };
    }
  } catch (err) {
    return { sucesso: false, erro: msgAmigavel(err.message) };
  }
}

export const FerramentasIA = { FERRAMENTAS, executar };
