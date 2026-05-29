import { supabase } from '../configuracoes/supabase';
import { ServicoLogs } from './servico_logs';

export const ServicoProdutos = {
  // Busca todas as categorias
  async listarCategorias() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'ATIVO')
        .order('hierarquia', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (erro) {
      ServicoLogs.adicionarLog("PRODUTOS_CATEGORIAS_ERRO", erro.message, "erro");
      return [];
    }
  },

  // Busca todos os produtos ativos junto com suas variações
  async listarProdutos() {
    try {
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'ATIVO');

      if (pErr) throw pErr;

      const { data: variations, error: vErr } = await supabase
        .from('variacoes')
        .select('*')
        .eq('status', 'ATIVO');

      if (vErr) throw vErr;

      // Buscar categorias para mapear ID -> Nome
      const { data: categorias } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'ATIVO');

      const catMap = {};
      (categorias || []).forEach(c => catMap[c.id] = c.nome);

      const produtosCompletos = (products || []).map(p => {
        const pVars = (variations || []).filter(v => v.produtoId === p.id || v.productId === p.id);
        const minPrice = pVars.length > 0 ? Math.min(...pVars.map(v => v.preco)) : 0;
        
        return {
          ...p,
          precoAtual: minPrice,
          variacoes: pVars,
          categoriaNome: catMap[Number(p.categoria)] || catMap[p.categoria] || 'Sem Categoria',
          titulo: p.nome,
          estoque: pVars.reduce((sum, v) => sum + (v.quantidadeStock || 0), 0)
        };
      });

      return produtosCompletos;
    } catch (erro) {
      ServicoLogs.adicionarLog("PRODUTOS_BUSCA_FALHA", erro.message, "erro");
      return [];
    }
  },

  // Busca um único produto por ID com suas variações
  async obterProdutoPorId(id) {
    try {
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', Number(id))
        .maybeSingle();

      if (pErr || !product) {
        if (pErr) ServicoLogs.adicionarLog("PRODUTOS_DETALHE_ERRO", pErr.message, "erro");
        return null;
      }

      const { data: variations } = await supabase
        .from('variacoes')
        .select('*')
        .eq('status', 'ATIVO');

      return {
        ...product,
        titulo: product.nome,
        variacoes: (variations || []).filter(v => v.produtoId === product.id || v.productId === product.id)
      };
    } catch (erro) {
      ServicoLogs.adicionarLog("PRODUTOS_DETALHE_ERRO", erro.message, "erro");
      return null;
    }
  },

  // Cria um produto (admin)
  async criarProduto(produto) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([produto])
        .select();

      if (error) throw error;
      
      ServicoLogs.adicionarLog("PRODUTO_CRIAR", `Produto criado: ${produto.nome}`, "sucesso");
      return { sucesso: true, data };
    } catch (erro) {
      ServicoLogs.adicionarLog("PRODUTO_CRIAR_FALHA", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  },

  // Atualiza um produto (admin)
  async editarProduto(id, campos) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(campos)
        .eq('id', id)
        .select();

      if (error) throw error;

      ServicoLogs.adicionarLog("PRODUTO_EDITAR", `Produto editado ID: ${id}`, "info");
      return { sucesso: true, data };
    } catch (erro) {
      ServicoLogs.adicionarLog("PRODUTO_EDITAR_FALHA", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  },

  // Remove um produto (admin)
  async excluirProduto(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      ServicoLogs.adicionarLog("PRODUTO_EXCLUIR", `Produto deletado ID: ${id}`, "info");
      return { sucesso: true };
    } catch (erro) {
      ServicoLogs.adicionarLog("PRODUTO_EXCLUIR_FALHA", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  }
};
