import React, { useState, useEffect } from "react";
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
  const produtosFiltrados = produtos.filter((p) => {
    const matchBusca = p.titulo?.toLowerCase().includes(termoBusca.toLowerCase()) || p.miniDesc?.toLowerCase().includes(termoBusca.toLowerCase()) || p.nome?.toLowerCase().includes(termoBusca.toLowerCase());
    const matchCategoria = categoriaAtiva === 'TODAS' || p.categoriaNome === categoriaAtiva;
    return matchBusca && matchCategoria;
  });

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative">
      
      {/* Barra de Busca */}
      <div className="mb-8 flex gap-4 max-w-xl mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
          <Search size={18} />
        </div>
        <input 
          id="loja_busca"
          type="text" 
          placeholder="O que você está procurando hoje?"
          value={termoBusca || ''}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="input-padrao pl-11 py-3 text-base shadow-sm"
        />
      </div>

      {/* Banner Principal */}
      <div className="relative bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-800 rounded-2xl p-6 md:p-8 mb-10 shadow-lg overflow-hidden select-none">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-secondary/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
              MERCADO PREMIUM
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-4 text-white tracking-tight">
              Bem vindo à <span className="text-primary">NexMarket</span>
            </h2>
            <p className="text-zinc-400 text-sm md:text-base mt-2">
              Chaves de jogos, contas, robux e fornecedores exclusivos a preço de atacado. Compre com segurança e entrega imediata!
            </p>
          </div>
          {usuario && (
            <div className="flex items-center gap-2.5 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/80 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_theme('colors.success')]"></span>
              <span>Logado como: <strong className="text-white font-semibold">{usuario.nome}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Abas de Categoria */}
      {!carregando && produtos.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide justify-center md:justify-start">
          {categoriasDisponiveis.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                categoriaAtiva === cat 
                  ? 'bg-primary text-white shadow-[0_0_15px_theme("colors.primary.DEFAULT")] opacity-100' 
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800'
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
