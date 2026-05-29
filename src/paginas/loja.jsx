import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contextos/contexto_autenticacao";
import { useCart } from "../contextos/contexto_carrinho";
import { ServicoProdutos } from "../servicos/servico_produtos";
import { ServicoLogs } from "../servicos/servico_logs";
import GradeProdutos from "../componentes/grade_produtos";
import CardProduto from "../componentes/card_produto";

import ModalLogs from "../componentes/modais/modal_logs";
import { Search } from "lucide-react";

export default function Loja() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { 
    carrinho,
    adicionarAoCarrinho,
    limparCarrinho,
    mostrarToast,
    termoBusca, setTermoBusca,
    logsAbertos, setLogsAbertos
  } = useCart();
  
  // Estados locais
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODAS');

  // Busca inicial dos produtos
  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const data = await ServicoProdutos.listarProdutos();
        setProdutos(data);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const lidarComComprarImediato = (produto) => {
    if (!usuario) {
      mostrarToast("erro", "Faça login para comprar.", "OPS!");
      navigate('/login');
      return;
    }
    const estoque = produto.estoque || produto.quantidadeStock || 0;
    if (estoque <= 0) {
      mostrarToast("erro", "Produto sem estoque no momento.", "ESGOTADO!");
      return;
    }
    try {
      const itemNoCarrinho = carrinho.find(item => (item.produto_id || item.produtoId) === produto.id);
      if (!itemNoCarrinho) {
        adicionarAoCarrinho(produto, 1);
      }
      navigate('/carrinho');
      ServicoLogs.adicionarLog("COMPRA_IMEDIATA_INICIADA", `Checkout direto iniciado para ${produto.titulo}.`, "info");
    } catch (erro) {
      mostrarToast("erro", erro.message);
    }
  };

  const lidarComAtualizacaoEstoque = (produtoId, qtdDeduzida) => {
    setProdutos((prevProdutos) =>
      prevProdutos.map((prod) => {
        if (prod.id === produtoId) {
          const novoEstoque = Math.max(0, prod.estoque - qtdDeduzida);
          return { ...prod, estoque: novoEstoque };
        }
        return prod;
      })
    );
  };

  const reabastecerEstoqueTudo = async () => {
    const data = await ServicoProdutos.listarProdutos();
    setProdutos(data);
    mostrarToast("sucesso", "Estoque sincronizado com o banco de dados!", "Sincronizado");
  };

  // Categorias Dinâmicas
  const categoriasDisponiveis = ['TODAS', ...new Set(produtos.map(p => p.categoriaNome).filter(Boolean))];

  // Filtragem de Produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchBusca = p.titulo?.toLowerCase().includes(termoBusca.toLowerCase()) || p.miniDesc?.toLowerCase().includes(termoBusca.toLowerCase()) || p.nome?.toLowerCase().includes(termoBusca.toLowerCase());
      const matchCategoria = categoriaAtiva === 'TODAS' || p.categoriaNome === categoriaAtiva;
      return matchBusca && matchCategoria;
    });
  }, [produtos, termoBusca, categoriaAtiva]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative">
      
      {/* Barra de Busca */}
      <div className="mb-8 flex gap-4 max-w-lg mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
          <Search size={18} />
        </div>
        <input 
          id="loja_busca"
          type="text" 
          placeholder="Buscar produtos..."
          value={termoBusca || ''}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="input-padrao pl-11 py-3 text-sm"
        />
      </div>

      {/* Banner Principal */}
      <div className="relative bg-gradient-to-br from-surface via-cardBg to-surface border border-white/[0.05] rounded-2xl p-6 md:p-8 mb-10 shadow-sm overflow-hidden select-none">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-secondary/[0.03] rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <span className="text-primary/60 text-[10px] font-semibold uppercase tracking-[0.15em]">
              MERCADO PREMIUM
            </span>
            <h2 className="text-xl md:text-2xl font-bold mt-2 text-white/90 tracking-tight">
              Bem vindo à <span className="text-primary">NexMarket</span>
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-2 leading-relaxed max-w-xl">
              Chaves de jogos, contas e fornecedores exclusivos a preço de atacado. Entrega imediata.
            </p>
          </div>
          {usuario && (
            <div className="flex items-center gap-2.5 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] px-4 py-2 rounded-xl text-xs font-medium text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              <span><strong className="text-zinc-200 font-semibold">{usuario.nome}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Abas de Categoria */}
      {!carregando && produtos.length > 0 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide justify-center md:justify-start">
          {categoriasDisponiveis.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ease-out-expo whitespace-nowrap ${
                categoriaAtiva === cat 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:bg-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Listagem principal */}
      {carregando ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Carregando catálogo...</p>
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
          <h3 className="text-lg font-semibold text-zinc-400 mb-2">Nenhum produto encontrado</h3>
          <p className="text-zinc-500 text-sm">Experimente buscar por outros termos ou categorias.</p>
        </div>
      ) : categoriaAtiva === 'TODAS' ? (
        <div className="space-y-10">
          {produtosFiltrados.reduce((acc, p) => {
            const catNome = p.categoriaNome || p.categoria || "Outros";
            if (!acc.find(g => g.categoria === catNome)) acc.push({ categoria: catNome, produtos: [] });
            const grupo = acc.find(g => g.categoria === catNome);
            grupo.produtos.push(p);
            return acc;
          }, []).map(grupo => (
            <section key={grupo.categoria}>
              <div className="flex items-center gap-3 mb-4 px-4">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">{grupo.categoria}</h2>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 px-4 scrollbar-hide snap-x snap-mandatory">
                {grupo.produtos.map(prod => (
                  <div key={prod.id} className="flex-shrink-0 w-[260px] snap-start">
                    <CardProduto
                      produto={prod}
                      aoClicar={() => navigate(`/produto/${prod.id}`)}
                      aoComprarImediato={lidarComComprarImediato}
                      aoAdicionarAoCarrinho={(produto, qtd) => {
                        if (!usuario) {
                          mostrarToast("erro", "Faça login para adicionar ao carrinho.", "OPS!");
                          navigate('/login');
                          return;
                        }
                        adicionarAoCarrinho(produto, qtd);
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <GradeProdutos
          produtos={produtosFiltrados}
          aoSelecionarProduto={(produto) => navigate(`/produto/${produto.id}`)}
          aoComprarImediato={lidarComComprarImediato}
          aoAdicionarAoCarrinho={(produto, qtd) => {
            if (!usuario) {
              mostrarToast("erro", "Faça login para adicionar ao carrinho.", "OPS!");
              navigate('/login');
              return;
            }
            adicionarAoCarrinho(produto, qtd);
          }}
        />
      )}

      {/* Botão Dev Logs */}
      <div className="mt-16 flex justify-center gap-3">
        <button 
          onClick={() => setLogsAbertos(true)}
          className="botao-neutro text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          Acessar Painel de Logs (Dev)
        </button>
      </div>

      {/* Modais */}
      {logsAbertos && (
        <ModalLogs
          aoFechar={() => setLogsAbertos(false)}
          produtosList={produtos}
          aoRecarregarEstoque={reabastecerEstoqueTudo}
        />
      )}

    </div>
  );
}
