import { supabase } from '../configuracoes/supabase';

function msgAmigavel(erro) {
  if (!erro) return 'Erro desconhecido.';
  const e = String(erro).toLowerCase();
  if (e.includes('permission') || e.includes('policy') || e.includes('violate') || e.includes('not allowed')) return 'Ação bloqueada. Verifique as permissões no Supabase.';
  if (e.includes('duplicate') || e.includes('unique')) return 'Já existe com esse identificador. Use outro nome/código.';
  if (e.includes('not found')) return 'Registro não encontrado. Confira o ID informado.';
  if (e.includes('foreign key') || e.includes('violates foreign')) return 'Este registro tem vínculos com outros dados. Remova os vínculos primeiro.';
  if (e.includes('network') || e.includes('fetch')) return 'Erro de conexão com o servidor.';
  if (e.includes('timeout') || e.includes('timed out')) return 'Operação demorou demais. Tente novamente.';
  if (e.includes('invalid input') || e.includes('syntax')) return 'Dados inválidos. Verifique o formato dos valores.';
  return `Erro: ${String(erro).slice(0, 200)}`;
}

function validar(valor, tipo, nome) {
  if (tipo === 'obrigatorio' && (valor === undefined || valor === null || String(valor).trim() === '')) {
    return { valido: false, erro: `"${nome}" é obrigatório.` };
  }
  if (tipo === 'numero') {
    const n = Number(valor);
    if (isNaN(n)) return { valido: false, erro: `"${nome}" precisa ser um número.` };
    if (n < 0) return { valido: false, erro: `"${nome}" não pode ser negativo.` };
  }
  return { valido: true };
}

const FERRAMENTAS = [
  {
    type: 'function',
    function: {
      name: 'listar_produtos',
      description: 'Lista todos os produtos da loja com variações e estoque',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'criar_produto',
      description: 'Cria um novo produto. Se não especificar categoria, usa a primeira disponível.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome do produto' },
          descricao: { type: 'string', description: 'Descrição detalhada' },
          miniDesc: { type: 'string', description: 'Descrição curta (opcional)' },
          bannerUrl: { type: 'string', description: 'URL da imagem (opcional)' },
          categoria: { type: 'string', description: 'ID da categoria como string (opcional)' }
        },
        required: ['nome']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'editar_produto',
      description: 'Edita campos de um produto existente (nome, descricao, categoria, status)',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID do produto' },
          nome: { type: 'string' },
          descricao: { type: 'string' },
          miniDesc: { type: 'string' },
          bannerUrl: { type: 'string' },
          categoria: { type: 'string', description: 'ID da categoria como string' },
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
      description: 'Adiciona variação/opção de compra a um produto',
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
      name: 'editar_variacao',
      description: 'Edita nome, preço ou estoque de uma variação',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID da variação' },
          nome: { type: 'string' },
          preco: { type: 'number' },
          quantidadeStock: { type: 'number' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remover_variacao',
      description: 'Remove uma variação de um produto',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID da variação' }
        },
        required: ['id']
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
      name: 'criar_categoria',
      description: 'Cria uma nova categoria',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome da categoria' }
        },
        required: ['nome']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_pedidos',
      description: 'Lista pedidos. Filtra por status (PENDENTE, PAGO, ENTREGUE, AGUARDANDO_PAGAMENTO)',
      parameters: {
        type: 'object',
        properties: {
          limite: { type: 'number', description: 'Máx de pedidos (padrão 50)' },
          status: { type: 'string', description: 'Filtrar por status do pedido (opcional)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'entregar_pedido',
      description: 'Marca um pedido como ENTREGUE. Primeiro pergunte o ID e o conteúdo a ser entregue.',
      parameters: {
        type: 'object',
        properties: {
          pedidoId: { type: 'string', description: 'ID do pedido' },
          conteudo: { type: 'string', description: 'Conteúdo da entrega (chaves, links, acessos)' }
        },
        required: ['pedidoId', 'conteudo']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_usuarios',
      description: 'Lista usuários cadastrados na loja',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'ver_estoque_baixo',
      description: 'Mostra produtos/variações com estoque baixo (abaixo de 5 unidades)',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'estatisticas_loja',
      description: 'Estatísticas completas: faturamento, produtos, pedidos, usuários',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'avaliar_loja',
      description: 'Análise completa da loja com diagnóstico e sugestões de melhoria',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'detalhes_pedido',
      description: 'Mostra detalhes completos de um pedido específico (itens, cliente, timeline)',
      parameters: {
        type: 'object',
        properties: {
          pedidoId: { type: 'string', description: 'ID do pedido' }
        },
        required: ['pedidoId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancelar_pedido',
      description: 'Cancela um pedido (só se não estiver entregue)',
      parameters: {
        type: 'object',
        properties: {
          pedidoId: { type: 'string', description: 'ID do pedido' }
        },
        required: ['pedidoId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adicionar_estoque',
      description: 'Adiciona chaves/credenciais ao estoque de uma variação automática',
      parameters: {
        type: 'object',
        properties: {
          variacaoId: { type: 'string', description: 'ID da variação' },
          chaves: { type: 'string', description: 'Chaves/credenciais, uma por linha' }
        },
        required: ['variacaoId', 'chaves']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_cupons',
      description: 'Lista todos os cupons de desconto cadastrados',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listar_logs',
      description: 'Mostra os logs recentes do sistema',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analisar_vendas',
      description: 'Análise detalhada de vendas: faturamento, pedidos por status, receita por mês',
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
        const vNome = validar(args.nome, 'obrigatorio', 'nome');
        if (!vNome.valido) return { sucesso: false, erro: vNome.erro };
        const id = Date.now() + Math.floor(Math.random() * 999);
        let categoria = args.categoria;
        if (!categoria) {
          const { data: cats } = await supabase.from('categories').select('id').limit(1);
          categoria = cats?.[0]?.id ? String(cats[0].id) : '1';
        }
        const nomeLimpo = args.nome.trim().slice(0, 200);
        const { error } = await supabase.from('products').insert([{
          id, nome: nomeLimpo, descricao: (args.descricao || '').slice(0, 2000),
          miniDesc: (args.miniDesc || '').slice(0, 200), bannerUrl: (args.bannerUrl || '').slice(0, 500),
          categoria, status: 'ATIVO',
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString()
        }]);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: { id, nome: nomeLimpo } };
      }
      case 'editar_produto': {
        const vId = validar(args.id, 'obrigatorio', 'id');
        if (!vId.valido) return { sucesso: false, erro: vId.erro };
        const updates = {};
        if (args.nome) updates.nome = String(args.nome).trim().slice(0, 200);
        if (args.descricao) updates.descricao = String(args.descricao).slice(0, 2000);
        if (args.miniDesc) updates.miniDesc = String(args.miniDesc).slice(0, 200);
        if (args.bannerUrl) updates.bannerUrl = String(args.bannerUrl).slice(0, 500);
        if (args.categoria) updates.categoria = String(args.categoria);
        if (args.status) updates.status = args.status;
        if (Object.keys(updates).length <= 1) return { sucesso: false, erro: 'Nenhum campo para editar informado.' };
        updates.dataAtualizacao = new Date().toISOString();
        const { error } = await supabase.from('products').update(updates).eq('id', args.id);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        const campos = Object.keys(updates).filter(k => k !== 'dataAtualizacao').join(', ');
        return { sucesso: true, dados: { id: args.id, alterado: campos } };
      }
      case 'deletar_produto': {
        const vId = validar(args.id, 'obrigatorio', 'id');
        if (!vId.valido) return { sucesso: false, erro: vId.erro };
        const { data: produto } = await supabase.from('products').select('id, nome').eq('id', args.id).maybeSingle();
        if (!produto) return { sucesso: false, erro: 'Produto não encontrado.' };
        const { data: vars } = await supabase.from('variacoes').select('id');
        const idsVar = (vars || []).filter(v => v.produtoId === args.id || v.productId === args.id).map(v => v.id);
        if (idsVar.length > 0) {
          const { error: e1 } = await supabase.from('variacoes').delete().in('id', idsVar);
          if (e1) return { sucesso: false, erro: msgAmigavel(e1.message) };
        }
        const { error } = await supabase.from('products').delete().eq('id', args.id);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: { id: args.id, nome: produto.nome, variacoesRemovidas: idsVar.length } };
      }
      case 'adicionar_variacao': {
        const vProd = validar(args.produtoId, 'obrigatorio', 'produtoId');
        const vNome = validar(args.nome, 'obrigatorio', 'nome');
        const vPreco = validar(args.preco, 'numero', 'preco');
        if (!vProd.valido) return { sucesso: false, erro: vProd.erro };
        if (!vNome.valido) return { sucesso: false, erro: vNome.erro };
        if (!vPreco.valido) return { sucesso: false, erro: vPreco.erro };
        const varId = Date.now() + Math.floor(Math.random() * 1000);
        const { error } = await supabase.from('variacoes').insert([{
          id: String(varId), produtoId: args.produtoId, nome: args.nome.trim().slice(0, 100),
          preco: Number(args.preco), estoque_tipo: args.estoque_tipo,
          quantidadeStock: args.quantidadeStock || 0,
          stockData: args.estoque_tipo === 'AUTOMATICA' ? [] : [],
          status: 'ATIVO', dataAtualizacao: new Date().toISOString()
        }]);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: { id: String(varId), nome: args.nome, preco: Number(args.preco) } };
      }
      case 'editar_variacao': {
        const updates = {};
        if (args.nome) updates.nome = args.nome;
        if (args.preco) updates.preco = args.preco;
        if (args.quantidadeStock !== undefined) updates.quantidadeStock = args.quantidadeStock;
        updates.dataAtualizacao = new Date().toISOString();
        const { error } = await supabase.from('variacoes').update(updates).eq('id', args.id);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true };
      }
      case 'remover_variacao': {
        const { error } = await supabase.from('variacoes').delete().eq('id', args.id);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true };
      }
      case 'criar_categoria': {
        const { data, error } = await supabase.from('categories').insert([{ nome: args.nome, status: 'ATIVO' }]).select();
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: data?.[0] || { nome: args.nome } };
      }
      case 'listar_categorias': {
        const { data, error } = await supabase.from('categories').select('*').order('id');
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: data || [] };
      }
      case 'listar_pedidos': {
        const { data, error } = await supabase.from('compras').select('*').limit(100);
        if (error) return { sucesso: false, erro: error.message };
        let filtrados = data || [];
        if (args?.status) {
          filtrados = filtrados.filter(p => p.status === args.status);
        }
        const ordenados = filtrados.sort((a, b) => {
          const da = a.dateCreated || a.DateCreated || 0;
          const db = b.dateCreated || b.DateCreated || 0;
          return new Date(db) - new Date(da);
        });
        return { sucesso: true, dados: ordenados.slice(0, args?.limite || 50) };
      }
      case 'entregar_pedido': {
        const vP = validar(args.pedidoId, 'obrigatorio', 'pedidoId');
        const vC = validar(args.conteudo, 'obrigatorio', 'conteudo');
        if (!vP.valido) return { sucesso: false, erro: vP.erro };
        if (!vC.valido) return { sucesso: false, erro: 'Informe o conteúdo da entrega (chaves, links, acessos).' };
        const { data: pedido, error: buscaErr } = await supabase.from('compras').select('*').eq('id', args.pedidoId).maybeSingle();
        if (buscaErr) return { sucesso: false, erro: msgAmigavel(buscaErr.message) };
        if (!pedido) return { sucesso: false, erro: 'Pedido não encontrado. Verifique o ID.' };
        if (pedido.status === 'ENTREGUE') return { sucesso: false, erro: 'Pedido já foi entregue anteriormente.' };
        const conteudo = String(args.conteudo).split('\n').filter(Boolean);
        if (conteudo.length === 0) return { sucesso: false, erro: 'Conteúdo vazio. Escreva as chaves/links a serem entregues.' };
        const timeline = [...(pedido.timeline || []), { status: 'ENTREGUE', label: 'Entregue pelo Assistente IA', date: new Date().toISOString() }];
        const { error: updateErr } = await supabase.from('compras').update({
          status: 'ENTREGUE', dateDelivered: new Date().toISOString(), timeline, deliveryContent: conteudo
        }).eq('id', args.pedidoId);
        if (updateErr) return { sucesso: false, erro: msgAmigavel(updateErr.message) };
        return { sucesso: true, dados: { id: args.pedidoId, status: 'ENTREGUE', itens: conteudo.length, cliente: pedido.userName || 'N/A' } };
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
      case 'listar_usuarios': {
        const { data, error } = await supabase.from('users').select('id, nome, email, role, criado_em').limit(100);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        const { data: compras } = await supabase.from('compras').select('userEmail, total, status');
        const comprasPorEmail = {};
        (compras || []).forEach(c => {
          const email = c.userEmail || '';
          if (!comprasPorEmail[email]) comprasPorEmail[email] = { total: 0, pedidos: 0 };
          comprasPorEmail[email].total += Number(c.total) || 0;
          comprasPorEmail[email].pedidos++;
        });
        const usuarios = (data || []).map(u => ({
          id: u.id,
          nome: u.nome,
          role: u.role,
          criado_em: u.criado_em,
          totalGasto: comprasPorEmail[u.email]?.total || 0,
          totalPedidos: comprasPorEmail[u.email]?.pedidos || 0
        }));
        return { sucesso: true, dados: usuarios };
      }
      case 'ver_estoque_baixo': {
        const [vRes, pRes] = await Promise.all([
          supabase.from('variacoes').select('*'),
          supabase.from('products').select('id, nome')
        ]);
        const produtos = pRes.data || [];
        const prodMap = {};
        produtos.forEach(p => prodMap[p.id] = p.nome);
        const baixo = (vRes.data || []).filter(v => v.estoque_tipo === 'AUTOMATICA' && (v.quantidadeStock || 0) < 5);
        return { sucesso: true, dados: baixo.map(v => ({ ...v, produtoNome: prodMap[v.produtoId] || 'Desconhecido' })) };
      }
      case 'detalhes_pedido': {
        const { data, error } = await supabase.from('compras').select('*').eq('id', args.pedidoId).maybeSingle();
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        if (!data) return { sucesso: false, erro: 'Pedido não encontrado.' };
        return { sucesso: true, dados: data };
      }
      case 'cancelar_pedido': {
        const { data: pedido, error: buscaErr } = await supabase.from('compras').select('*').eq('id', args.pedidoId).maybeSingle();
        if (buscaErr) return { sucesso: false, erro: msgAmigavel(buscaErr.message) };
        if (!pedido) return { sucesso: false, erro: 'Pedido não encontrado.' };
        if (pedido.status === 'ENTREGUE') return { sucesso: false, erro: 'Pedido já entregue não pode ser cancelado.' };
        const timeline = [...(pedido.timeline || []), { status: 'CANCELADO', label: 'Cancelado pelo Assistente IA', date: new Date().toISOString() }];
        const { error } = await supabase.from('compras').update({ status: 'CANCELADO', timeline }).eq('id', args.pedidoId);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: { id: args.pedidoId, status: 'CANCELADO' } };
      }
      case 'adicionar_estoque': {
        const vV = validar(args.variacaoId, 'obrigatorio', 'variacaoId');
        const vC = validar(args.chaves, 'obrigatorio', 'chaves');
        if (!vV.valido) return { sucesso: false, erro: vV.erro };
        if (!vC.valido) return { sucesso: false, erro: 'Informe as chaves/credenciais, uma por linha.' };
        const { data: variacao, error: vErr } = await supabase.from('variacoes').select('*').eq('id', args.variacaoId).maybeSingle();
        if (vErr) return { sucesso: false, erro: msgAmigavel(vErr.message) };
        if (!variacao) return { sucesso: false, erro: 'Variação não encontrada. Confira o ID.' };
        const chaves = String(args.chaves).split('\n').filter(Boolean);
        if (chaves.length === 0) return { sucesso: false, erro: 'Nenhuma chave válida informada.' };
        const stockAtual = Array.isArray(variacao.stockData) ? variacao.stockData : [];
        const { error } = await supabase.from('variacoes').update({
          stockData: [...stockAtual, ...chaves],
          quantidadeStock: (variacao.quantidadeStock || 0) + chaves.length,
          dataAtualizacao: new Date().toISOString()
        }).eq('id', args.variacaoId);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: { variacaoId: args.variacaoId, adicionadas: chaves.length, totalAgora: (variacao.quantidadeStock || 0) + chaves.length } };
      }
      case 'listar_cupons': {
        const { data, error } = await supabase.from('cupons').select('*').order('criado_em', { ascending: false });
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: data || [] };
      }
      case 'listar_logs': {
        const { data, error } = await supabase.from('logs_sistema').select('*').order('data_hora', { ascending: false }).limit(50);
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        return { sucesso: true, dados: data || [] };
      }
      case 'analisar_vendas': {
        const { data: compras, error } = await supabase.from('compras').select('*');
        if (error) return { sucesso: false, erro: msgAmigavel(error.message) };
        const todas = compras || [];
        const totalFaturado = todas.filter(c => ['ENTREGUE', 'PAGO'].includes(c.status)).reduce((s, c) => s + Number(c.total || 0), 0);
        const porStatus = {};
        todas.forEach(c => { porStatus[c.status] = (porStatus[c.status] || 0) + 1; });
        const porMes = {};
        todas.forEach(c => {
          const d = new Date(c.dateCreated || Date.now());
          const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!porMes[mes]) porMes[mes] = { pedidos: 0, receita: 0 };
          porMes[mes].pedidos++;
          if (['ENTREGUE', 'PAGO'].includes(c.status)) porMes[mes].receita += Number(c.total || 0);
        });
        return { sucesso: true, dados: { totalFaturado, totalPedidos: todas.length, porStatus, porMes: Object.entries(porMes).sort().reverse().slice(0, 6) } };
      }
      case 'avaliar_loja': {
        const [pRes, vRes, cRes, uRes, configRes] = await Promise.all([
          supabase.from('products').select('id, status, categoria'),
          supabase.from('variacoes').select('id, produtoId, preco, quantidadeStock, estoque_tipo'),
          supabase.from('compras').select('id, total, status, dateCreated'),
          supabase.from('users').select('id'),
          supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle()
        ]);
        const produtos = pRes.data || [];
        const variacoes = vRes.data || [];
        const compras = cRes.data || [];
        const usuarios = uRes.data || [];
        const config = configRes.data || {};
        const ativos = produtos.filter(p => p.status === 'ATIVO');
        const inativos = produtos.filter(p => p.status === 'INATIVO');
        const faturamento = compras.filter(c => ['ENTREGUE', 'PAGO'].includes(c.status)).reduce((s, c) => s + Number(c.total || 0), 0);
        const pendentes = compras.filter(c => c.status === 'AGUARDANDO_PAGAMENTO').length;
        const semVariacao = ativos.filter(p => !variacoes.some(v => v.produtoId === p.id));
        const estoqueBaixo = variacoes.filter(v => v.estoque_tipo === 'AUTOMATICA' && (v.quantidadeStock || 0) < 5);
        const sugestoes = [];
        if (semVariacao.length > 0) sugestoes.push(`${semVariacao.length} produtos ativos sem variação — adicione opções de compra`);
        if (inativos.length > 0) sugestoes.push(`${inativos.length} produtos inativos — reative ou delete`);
        if (estoqueBaixo.length > 0) sugestoes.push(`${estoqueBaixo.length} variações com estoque baixo`);
        if (pendentes > 0) sugestoes.push(`${pendentes} pedidos aguardando pagamento`);
        if (produtos.length < 5) sugestoes.push('Poucos produtos — crie mais para aumentar vendas');
        if (!sugestoes.length) sugestoes.push('Loja saudável! Continue assim.');
        return { sucesso: true, dados: {
          produtos: { total: produtos.length, ativos: ativos.length, inativos: inativos.length },
          variacoes: variacoes.length,
          usuarios: usuarios.length,
          pedidos: compras.length,
          faturamento: faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          pendentes,
          estoqueBaixo: estoqueBaixo.length,
          semVariacao: semVariacao.length,
          nomeLoja: config.nome_loja || 'NEXMARKET',
          sugestoes
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
