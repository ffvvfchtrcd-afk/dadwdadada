import { supabase } from '../configuracoes/supabase';
import { ServicoLogs } from './servico_logs';

const STORAGE_KEY = "nexmarket_cart";

const cacheLocal = {
  carregar(usuarioId) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${usuarioId}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  salvar(usuarioId, dados) {
    try { localStorage.setItem(`${STORAGE_KEY}_${usuarioId}`, JSON.stringify(dados)); } catch {}
  },
  remover(usuarioId) {
    try { localStorage.removeItem(`${STORAGE_KEY}_${usuarioId}`); } catch {}
  }
};

let tabelaExiste = true;

export const ServicoCarrinho = {
  async listarItens(usuarioId) {
    if (!usuarioId) return [];
    if (!tabelaExiste) return cacheLocal.carregar(usuarioId);

    try {
      const { data, error } = await supabase
        .from('carrinho_itens')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      const itens = data || [];
      cacheLocal.salvar(usuarioId, itens);
      return itens;
    } catch {
      tabelaExiste = false;
      return cacheLocal.carregar(usuarioId);
    }
  },

  async adicionarItem(usuarioId, produto, variacaoId = null, quantidade = 1) {
    if (!usuarioId) throw new Error("Faça login para adicionar ao carrinho.");
    if (!produto || !produto.id) throw new Error("Produto inválido.");
    if (quantidade <= 0) throw new Error("Quantidade deve ser maior que zero.");

    const ehManual = produto.estoque_tipo && produto.estoque_tipo !== 'AUTOMATICA' && produto.estoque_tipo !== 'AGENTE';
    const estoque = ehManual ? 9999 : (produto.estoque || produto.quantidadeStock || 999);
    if (quantidade > estoque) {
      throw new Error(`Estoque insuficiente! Apenas ${estoque} unidades disponíveis.`);
    }

    if (tabelaExiste) {
      try {
        const { data: existente } = await supabase
          .from('carrinho_itens')
          .select('*')
          .eq('usuario_id', usuarioId)
          .eq('produto_id', produto.id)
          .eq('variacao_id', variacaoId)
          .maybeSingle();

        if (existente) {
          const novaQtd = existente.quantidade + quantidade;
          if (novaQtd > estoque) throw new Error(`Estoque insuficiente! Máximo ${estoque} unidades.`);
          const { error } = await supabase
            .from('carrinho_itens')
            .update({ quantidade: novaQtd, atualizado_em: new Date().toISOString() })
            .eq('id', existente.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('carrinho_itens')
            .insert([{
              usuario_id: usuarioId, produto_id: produto.id, variacao_id: variacaoId,
              titulo: produto.titulo || produto.nome,
              preco: produto.precoAtual || produto.preco || 0, quantidade,
              estoque_max: estoque, estoque_tipo: produto.estoque_tipo || 'AUTOMATICA',
              variation_name: produto.variation_name || null,
              imagem_url: produto.imagem_url || produto.bannerUrl || null,
              criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString()
            }]);
          if (error) throw error;
        }

        ServicoLogs.adicionarLog("CARRINHO_ADICIONAR", `Adicionado ${quantidade}x ${produto.titulo || produto.nome} ao carrinho.`, "sucesso");
        return;
      } catch (erro) {
        if (erro.message?.startsWith("Estoque")) throw erro;
        tabelaExiste = false;
      }
    }

    const itens = cacheLocal.carregar(usuarioId);
    const existente = itens.find(i => (i.produto_id || i.produtoId) === produto.id && (i.variacao_id || null) === (variacaoId || null));
    if (existente) {
      const novaQtd = existente.quantidade + quantidade;
      if (novaQtd > estoque) throw new Error(`Estoque insuficiente! Máximo ${estoque} unidades.`);
      existente.quantidade = novaQtd;
    } else {
      itens.push({
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        usuario_id: usuarioId, produto_id: produto.id, variacao_id: variacaoId,
        titulo: produto.titulo || produto.nome,
        preco: produto.precoAtual || produto.preco || 0, quantidade, estoque_max: estoque, estoque_tipo: produto.estoque_tipo || 'AUTOMATICA',
        variation_name: produto.variation_name || null,
        imagem_url: produto.imagem_url || produto.bannerUrl || null,
        criado_em: new Date().toISOString()
      });
    }
    cacheLocal.salvar(usuarioId, itens);
    ServicoLogs.adicionarLog("CARRINHO_ADICIONAR", `Adicionado ${quantidade}x ${produto.titulo || produto.nome} ao carrinho (local).`, "sucesso");
  },

  async removerItem(usuarioId, itemId) {
    if (!usuarioId) return;
    if (tabelaExiste) {
      try {
        await supabase.from('carrinho_itens').delete().eq('id', itemId).eq('usuario_id', usuarioId);
      } catch { tabelaExiste = false; }
    }
    const itens = cacheLocal.carregar(usuarioId).filter(i => i.id !== itemId);
    cacheLocal.salvar(usuarioId, itens);
  },

  async atualizarQuantidade(usuarioId, itemId, novaQuantidade, estoqueMax) {
    if (!usuarioId) return;
    if (novaQuantidade <= 0) { await this.removerItem(usuarioId, itemId); return; }
    if (novaQuantidade > estoqueMax) throw new Error(`Estoque máximo atingido (${estoqueMax} un.).`);
    if (tabelaExiste) {
      try {
        await supabase.from('carrinho_itens').update({ quantidade: novaQuantidade, atualizado_em: new Date().toISOString() }).eq('id', itemId).eq('usuario_id', usuarioId);
      } catch { tabelaExiste = false; }
    }
    const itens = cacheLocal.carregar(usuarioId).map(i => i.id === itemId ? { ...i, quantidade: novaQuantidade } : i);
    cacheLocal.salvar(usuarioId, itens);
  },

  async limparCarrinho(usuarioId) {
    if (!usuarioId) return;
    if (tabelaExiste) {
      try { await supabase.from('carrinho_itens').delete().eq('usuario_id', usuarioId); } catch {}
    }
    cacheLocal.remover(usuarioId);
  },

  cupomCache: null,

  async carregarCupomAtivo() {
    if (this.cupomCache) return this.cupomCache;
    try {
      const { data: config } = await supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle();
      if (config?.cupom_ativo) {
        const { data: cupom } = await supabase.from('cupons').select('*').eq('codigo', config.cupom_codigo).maybeSingle();
        if (cupom?.ativo) {
          this.cupomCache = cupom;
          return cupom;
        }
      }
      return null;
    } catch { return null; }
  },

  limparCacheCupom() {
    this.cupomCache = null;
  },

  calcularSubtotal(carrinho) {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  },
  calcularDesconto(subtotal, cupomCodigo, porcentagem) {
    if (!cupomCodigo) return 0;
    return subtotal * (porcentagem || 0);
  },
  calcularTotal(carrinho, cupomCodigo, porcentagem) {
    const subtotal = this.calcularSubtotal(carrinho);
    const desconto = this.calcularDesconto(subtotal, cupomCodigo, porcentagem);
    return Math.max(0, subtotal - desconto);
  }
};
