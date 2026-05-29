import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contextos/contexto_autenticacao';
import { useCart } from '../contextos/contexto_carrinho';
import { supabase } from '../configuracoes/supabase';
import { ServicoProdutos } from '../servicos/servico_produtos';
import { ServicoEstoque } from '../servicos/servico_estoque';
import { ServicoLogs } from '../servicos/servico_logs';
import { FormatarMoeda } from '../utilitarios/formatadores';
import { Star, ChevronLeft, ShoppingCart, CreditCard, ShieldCheck, Layers, Zap } from 'lucide-react';

export default function DetalhesProduto() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { adicionarAoCarrinho: adicionarAoCarrinhoContexto } = useCart();
  const navigate = useNavigate();

  const [produto, setProduto] = useState(null);
  const [variacaoSelecionada, setVariacaoSelecionada] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("descricao");

  // Alerta Toast
  const [toastMessage, setToastMessage] = useState(null);

  const carregarProduto = async () => {
    try {
      setCarregando(true);
      const data = await ServicoProdutos.obterProdutoPorId(id);
      if (data) {
        setProduto(data);
        if (data.variacoes && data.variacoes.length > 0) {
          setVariacaoSelecionada(data.variacoes[0]);
        }
      } else {
        setProduto(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProduto();
  }, [id]);

  const mostrarToast = (mensagem) => {
    setToastMessage(mensagem);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (carregando) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-[#b92cff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-cartoon text-xs text-gray-400">CARREGANDO DETALHES DO PRODUTO...</p>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="text-center py-20">
        <h3 className="fonte-cartoon text-lg text-white mb-2">Produto não encontrado</h3>
        <Link to="/" className="botao-neutro text-xs">
          Voltar para a vitrine
        </Link>
      </div>
    );
  }

  const ehManual = variacaoSelecionada?.estoque_tipo && variacaoSelecionada.estoque_tipo !== 'AUTOMATICA' && variacaoSelecionada.estoque_tipo !== 'AGENTE';
  const semEstoque = !ehManual && variacaoSelecionada ? (variacaoSelecionada.quantidadeStock || 0) <= 0 : false;

  const lidarComAdicionarCarrinho = async () => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    if (!variacaoSelecionada) {
      mostrarToast("Selecione uma opção antes de adicionar.");
      return;
    }
    if (semEstoque) {
      mostrarToast("Esta opção está esgotada no momento.");
      return;
    }
    const produtoCarrinho = {
      id: produto.id,
      titulo: `${produto.titulo} (${variacaoSelecionada.nome})`,
      precoAtual: variacaoSelecionada.preco,
      estoque: variacaoSelecionada.quantidadeStock,
      estoque_tipo: variacaoSelecionada.estoque_tipo,
      variacao_id: variacaoSelecionada.id,
      variation_name: variacaoSelecionada.nome,
      imagem_url: variacaoSelecionada.imagem_url || produto.bannerUrl || null,
      bannerUrl: produto.bannerUrl
    };
    await adicionarAoCarrinhoContexto(produtoCarrinho, quantidade);
  };

  const lidarComComprarAgora = async () => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    if (!variacaoSelecionada) {
      mostrarToast("Selecione uma opção.");
      return;
    }
    if (semEstoque) {
      mostrarToast("Esta opção está esgotada no momento.");
      return;
    }

    const total = variacaoSelecionada.preco * quantidade;
    const pedidoId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const groupId = `GRP-${Date.now()}`;

    try {
      const novoPedido = {
        id: pedidoId,
        groupId,
        userId: usuario.id,
        userName: usuario.nome,
        productId: produto.id,
        productName: produto.titulo,
        variationId: variacaoSelecionada.id,
        variationName: variacaoSelecionada.nome,
        quantity: quantidade,
        total,
        status: 'AGUARDANDO_PAGAMENTO',
        metodoEntrega: variacaoSelecionada.estoque_tipo === 'AUTOMATICA' ? 'AUTOMATICA' : 'MANUAL',
        deliveryContent: ['Aguardando confirmação do pagamento...'],
        date: new Date().toISOString(),
        timeline: [
          { status: 'CRIADO', label: 'Pedido Criado', date: new Date().toISOString() }
        ]
      };

      try {
        const { error } = await supabase.from('compras').insert([novoPedido]);
        if (error) throw error;
      } catch (err) {
        if (err.message?.toLowerCase().includes('groupid')) {
          delete novoPedido.groupId;
          const { error: retry } = await supabase.from('compras').insert([novoPedido]);
          if (retry) throw retry;
        } else {
          throw err;
        }
      }

      ServicoLogs.adicionarLog("PEDIDO_CRIADO_DIRETO", `Pedido ${pedidoId} criado via compra direta para ${usuario.nome}.`, "info");

      sessionStorage.setItem("nexmarket_checkout", JSON.stringify({
        pedidoIds: [pedidoId],
        total,
        limparCarrinho: false
      }));
      navigate("/checkout");
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao criar pedido. Tente novamente.");
    }
  };

  const obterBadgeEstoque = (variacao) => {
    const isManual = variacao.estoque_tipo && variacao.estoque_tipo !== 'AUTOMATICA' && variacao.estoque_tipo !== 'AGENTE';
    if (isManual) {
      return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">ENTREGA MANUAL</span>;
    }
    const visual = ServicoEstoque.obterEstoqueVisual(variacao);
    if (visual <= 0) {
      return <span className="bg-[#ff2a74] text-white px-2 py-0.5 rounded text-[10px] font-bold">ESTOQUE ESGOTADO</span>;
    }
    if (visual < 5) {
      return <span className="bg-[#ffe600] text-black px-2 py-0.5 rounded text-[10px] font-bold">ESTOQUE {visual}</span>;
    }
    return <span className="bg-[#00e676] text-black px-2 py-0.5 rounded text-[10px] font-bold">ESTOQUE {visual}</span>;
  };

  const avaliacoes = produto.avaliacoes || [];
  const totalAvaliacoes = avaliacoes.length;
  const mediaEstrelas = totalAvaliacoes > 0
    ? (avaliacoes.reduce((soma, r) => soma + r.estrelas, 0) / totalAvaliacoes).toFixed(1)
    : "0";

  const descricaoObj = typeof produto.descricao === 'object' ? produto.descricao : null;
  const descricaoDetalhes = descricaoObj?.detalhes || [];
  const descricaoTitulo = descricaoObj?.titulo || '';

  const precoAtual = variacaoSelecionada?.preco || produto.precoAtual || 0;
  const precoOriginal = produto.precoOriginal || 0;
  const desconto = produto.desconto || 0;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-white mb-6 text-xs font-bold transition-colors">
        <ChevronLeft size={16} />
        Voltar para a vitrine
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Banner do produto */}
        <div className="md:col-span-5 space-y-4">
          <div className="card-padrao overflow-hidden bg-[#0d091e] border border-zinc-800 shadow-md rotate-[-1deg]">
            <img 
              src={variacaoSelecionada?.imagem_url || produto.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600"} 
              alt={produto.titulo}
              className="w-full h-auto object-cover border-b-3 border-black"
            />
            <div className="absolute -mt-8 ml-2 bg-[#b92cff] border border-zinc-700 px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider shadow-sm">
              NEXMARKET
            </div>
            <div className="p-4 bg-[#120e2a] flex justify-between items-center text-xs">
              <span className="text-gray-400 uppercase tracking-widest font-bold">Categoria:</span>
              <span className="bg-[#b92cff] border border-zinc-700 text-black font-black px-2 py-0.5 rounded shadow-sm uppercase">
                {produto.categoria || 'VIP'}
              </span>
            </div>
          </div>

          <div className="card-padrao p-5 bg-[#0d091e] border border-zinc-800 text-xs space-y-3">
            <div className="flex items-center gap-2 text-[#00f0ff] font-bold">
              <ShieldCheck size={16} />
              <span>Garantia de Entrega</span>
            </div>
            <p className="text-gray-400">
              Todos os nossos produtos digitais possuem autenticação direta e são testados. Suporte ativo 24/7.
            </p>
          </div>
        </div>

        {/* Informações de Compra */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#ffe600] border border-black text-black px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_#000]">
                ENTREGA DIGITAL
              </span>
              <span className="bg-[#b92cff]/20 text-[#b92cff] border border-[#b92cff]/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                +{produto.vendidos || 0} Vendidos
              </span>
            </div>
            <h1 className="fonte-cartoon text-xl md:text-3xl text-white glow-roxo">
              {produto.titulo}
            </h1>
            <p className="text-sm text-gray-400">
              {produto.miniDesc || 'Produto VIP com envio instantâneo e total garantia de funcionamento.'}
            </p>
          </div>

          {/* Preço */}
          <div className="flex items-baseline gap-3">
            {precoOriginal > precoAtual && (
              <span className="text-gray-500 line-through text-sm">
                {FormatarMoeda(precoOriginal)}
              </span>
            )}
            {desconto > 0 && (
              <span className="bg-[#ff2a74] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                -{desconto}%
              </span>
            )}
            <span className="text-2xl font-black text-[#00f0ff] flex items-center gap-1">
              {FormatarMoeda(precoAtual)}
              <Zap size={18} className="fill-[#00f0ff]" />
            </span>
          </div>

          {/* Estoque */}
          {!produto.variacoes?.length && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold uppercase">Estoque:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${(produto.estoque || 0) > 0 ? "bg-[#00e676]/20 text-[#00e676]" : "bg-red-500/20 text-red-500"}`}>
                {(produto.estoque || 0) > 0 ? `${produto.estoque} Disponível` : "Sem Estoque"}
              </span>
            </div>
          )}

          {/* Selecionar Variação */}
          {produto.variacoes && produto.variacoes.length > 0 && (
            <div className="space-y-3">
              <h3 className="fonte-cartoon text-xs text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-[#00f0ff]" />
                Escolha a Opção Desejada
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {produto.variacoes.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setVariacaoSelecionada(v)}
                    className={`card-padrao p-4 cursor-pointer text-left transition-all ${
                      variacaoSelecionada?.id === v.id
                        ? 'border-[#b92cff] bg-[#221746] shadow-[4px_4px_0px_#b92cff]'
                        : 'border-black bg-[#0d091e]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-white block">{v.nome}</span>
                      {obterBadgeEstoque(v)}
                    </div>
                    <span className="font-cartoon text-sm text-[#00f0ff]">{FormatarMoeda(v.preco)}</span>
                    <span className="text-[9px] text-gray-400 block mt-1">
                      {v.estoque_tipo === 'AUTOMATICA' ? 'ENTREGA AUTOMÁTICA' : 'ENTREGA MANUAL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {variacaoSelecionada?.descricao && (
            <div className="card-padrao p-4 bg-[#120e2a] border border-zinc-800">
              <p className="text-xs text-gray-300 leading-relaxed">{variacaoSelecionada.descricao}</p>
            </div>
          )}

          {/* Quantidade e Compra */}
          <div className="card-padrao p-5 bg-[#120e2a] border border-zinc-800 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-bold uppercase">Qtd:</span>
              <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden bg-black/40">
                <button
                  onClick={() => setQuantidade(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1 bg-black/40 font-bold hover:bg-black/60 transition-colors"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold">{quantidade}</span>
                <button
                  onClick={() => setQuantidade(prev => prev + 1)}
                  className="px-3 py-1 bg-black/40 font-bold hover:bg-black/60 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                disabled={semEstoque}
                onClick={lidarComAdicionarCarrinho}
                className={`flex-1 sm:flex-none text-xs font-bold uppercase shadow-sm py-2.5 ${semEstoque ? 'botao-neutro opacity-30 cursor-not-allowed' : 'botao-neutro'}`}
              >
                <ShoppingCart size={15} />
                {semEstoque ? 'Esgotado' : 'Carrinho'}
              </button>
              <button
                disabled={semEstoque}
                onClick={lidarComComprarAgora}
                className={`flex-1 sm:flex-none text-xs font-bold uppercase shadow-sm py-2.5 ${semEstoque ? 'botao-primario opacity-30 cursor-not-allowed grayscale' : 'botao-primario'}`}
              >
                <CreditCard size={15} />
                {semEstoque ? 'Esgotado' : 'Comprar'}
              </button>
            </div>
          </div>

          {/* Tabs: Descrição / Avaliações */}
          <div>
            <div className="flex border-b border-gray-800 gap-2 select-none mb-4">
              <button 
                onClick={() => setAbaAtiva("descricao")}
                className={`pb-2 px-4 font-bold text-xs border-b-2 transition-colors ${abaAtiva === "descricao" ? "border-[#b92cff] text-[#b92cff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                Descrição
              </button>
              <button 
                onClick={() => setAbaAtiva("avaliacoes")}
                className={`pb-2 px-4 font-bold text-xs border-b-2 transition-colors ${abaAtiva === "avaliacoes" ? "border-[#b92cff] text-[#b92cff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                Avaliações ({totalAvaliacoes})
              </button>
            </div>

            {abaAtiva === "descricao" ? (
              <div className="card-padrao p-6 bg-[#0d091e] border border-zinc-800 space-y-4">
                {descricaoDetalhes.length > 0 ? (
                  <>
                    <h3 className="font-extrabold text-[#00f0ff] text-xs uppercase tracking-wider">{descricaoTitulo}</h3>
                    <ul className="space-y-2.5">
                      {descricaoDetalhes.map((detalhe, index) => (
                        <li key={index} className="flex gap-2 text-sm text-gray-300">
                          <span>âš¡</span>
                          <span>{detalhe}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div 
                    className="text-xs text-gray-300 leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: produto.descricao || 'Nenhuma descrição fornecida.' }}
                  />
                )}
              </div>
            ) : (
              <div className="card-padrao p-6 bg-[#0d091e] border border-zinc-800">
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <span className="text-5xl font-black text-[#b92cff]">{mediaEstrelas}</span>
                    <div className="flex justify-center gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={16} 
                          className={s <= Math.round(Number(mediaEstrelas)) ? "fill-[#ffe600] text-[#ffe600]" : "text-gray-600"} 
                        />
                      ))}
                    </div>
                    <span className="text-gray-400 text-xs">{totalAvaliacoes} avaliações</span>
                  </div>

                  <div className="flex-1 space-y-1 max-w-xs">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const count = avaliacoes.filter(r => r.estrelas === s).length;
                      const percent = totalAvaliacoes > 0 ? (count / totalAvaliacoes) * 100 : 0;
                      return (
                        <div key={s} className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="w-3 text-right">{s}â˜…</span>
                          <div className="flex-1 h-2 bg-gray-800 rounded overflow-hidden">
                            <div className="h-full bg-[#ffe600]" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="w-4 text-left">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {totalAvaliacoes === 0 ? (
                  <div className="text-center py-6 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                    <p className="text-sm">Nenhuma avaliação encontrada para este produto.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {avaliacoes.map((av) => (
                      <div key={av.id} className="bg-[#120e2a] border border-gray-800 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-sm block">{av.autor}</span>
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  size={12} 
                                  className={s <= av.estrelas ? "fill-[#ffe600] text-[#ffe600]" : "text-gray-600"} 
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs">{av.data}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{av.comentario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#b92cff] border border-zinc-800 p-4 rounded-xl shadow-md text-black font-bold text-xs animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

