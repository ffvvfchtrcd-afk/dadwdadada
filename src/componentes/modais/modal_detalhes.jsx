import React, { useState } from "react";
import ImagemProduto from "../imagem_produto";
import BotaoComprar from "../botoes/botao_comprar";
import BotaoCarrinho from "../botoes/botao_carrinho";
import BotaoFechar from "../botoes/botao_fechar";
import { FormatarMoeda } from "../../utilitarios/formatadores";
import { Star, ShieldAlert, Zap } from "lucide-react";

export default function ModalDetalhes({ produto, aoFechar, aoComprarAgora, aoAdicionarAoCarrinho }) {
  if (!produto) return null;

  const [quantidade, setQuantidade] = useState(1);
  const [abaAtiva, setAbaAtiva] = useState("descricao"); // 'descricao' ou 'avaliacoes'

  const incrementarQuantidade = () => {
    if (quantidade < produto.estoque) {
      setQuantidade(prev => prev + 1);
    }
  };

  const decrementarQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(prev => prev - 1);
    }
  };

  // Calcular mÃ©dia de estrelas
  const avaliacoes = produto.avaliacoes || [];
  const totalAvaliacoes = avaliacoes.length;
  const mediaEstrelas = totalAvaliacoes > 0
    ? (avaliacoes.reduce((soma, r) => soma + r.estrelas, 0) / totalAvaliacoes).toFixed(1)
    : "0";

  return (
    <div 
      id="modal_detalhes_overlay"
      className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={aoFechar}
    >
      <div 
        id="modal_detalhes"
        className="card-padrao w-full max-w-4xl bg-[#0d091e] border border-zinc-800 text-white p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BotÃ£o de Fechar */}
        <div className="absolute top-4 right-4">
          <BotaoFechar onClick={aoFechar} modalId="detalhes" />
        </div>

        {/* Breadcrumbs */}
        <div className="text-gray-400 text-xs mb-4 flex items-center gap-1 select-none">
          <span className="hover:text-white cursor-pointer">InÃ­cio</span>
          <span>&gt;</span>
          <span className="hover:text-white cursor-pointer">Produtos</span>
          <span>&gt;</span>
          <span className="text-[#00f0ff] font-semibold truncate max-w-[200px]">
            {produto.titulo}
          </span>
        </div>

        {/* Grade de InformaÃ§Ãµes de Cima */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          
          {/* Coluna da Imagem (4/12) */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-md">
              <ImagemProduto produtoId={produto.id} />
              <div className="absolute bottom-2 left-2 bg-[#b92cff] border border-zinc-700 px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider shadow-sm">
                NEXMARKET
              </div>
            </div>
          </div>

          {/* Coluna de AÃ§Ãµes/PreÃ§o (7/12) */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <span className="bg-[#b92cff]/20 text-[#b92cff] border border-[#b92cff]/50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                +{produto.vendidos} Vendidos
              </span>
              
              <h1 className="fonte-cartoon text-xl md:text-2xl mt-2 mb-3 leading-tight text-white uppercase border-b border-gray-800 pb-2">
                {produto.titulo}
              </h1>

              <div className="flex items-baseline gap-3 mb-2">
                {produto.precoOriginal > produto.precoAtual && (
                  <span className="text-gray-500 line-through text-sm">
                    {FormatarMoeda(produto.precoOriginal)}
                  </span>
                )}
                {produto.desconto > 0 && (
                  <span className="bg-[#ff2a74] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    -{produto.desconto}%
                  </span>
                )}
                <span className="text-2xl font-black text-[#00f0ff] flex items-center gap-1">
                  {FormatarMoeda(produto.precoAtual)}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/40 px-2 py-1 rounded text-xs font-bold mb-6">
                <Zap size={14} className="fill-[#00f0ff]" />
                ENTREGA AUTOMÃTICA
              </div>
            </div>

            {/* Card de Compra/Estoque */}
            <div className="border border-zinc-800 bg-[#130f2c] rounded-xl p-4 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-xs font-semibold uppercase">Estoque disponÃ­vel</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${produto.estoque > 0 ? "bg-[#00e676]/20 text-[#00e676]" : "bg-red-500/20 text-red-500"}`}>
                  {produto.estoque > 0 ? `${produto.estoque} DisponÃ­vel` : "Sem Estoque"}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-xl font-bold">{FormatarMoeda(produto.precoAtual * quantidade)}</span>
                
                {/* Seletor de Quantidade */}
                {produto.estoque > 0 && (
                  <div className="flex items-center border border-zinc-700 rounded-lg bg-[#0d091e] overflow-hidden shadow-sm">
                    <button 
                      id="detalhes_quantidade_remover"
                      onClick={decrementarQuantidade}
                      className="px-3 py-1 hover:bg-gray-800 font-extrabold border-r-2 border-black transition-colors"
                      disabled={quantidade <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-bold text-sm min-w-[40px] text-center select-none">
                      {quantidade}
                    </span>
                    <button 
                      id="detalhes_quantidade_adicionar"
                      onClick={incrementarQuantidade}
                      className="px-3 py-1 hover:bg-gray-800 font-extrabold border-l-2 border-black transition-colors"
                      disabled={quantidade >= produto.estoque}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  id="detalhes_comprar_agora"
                  onClick={() => aoComprarAgora(produto, quantidade)}
                  className="btn-base bg-white text-zinc-900 hover:bg-gray-200 shadow-sm text-black font-extrabold w-full py-2.5 rounded-lg border border-zinc-700 shadow-sm"
                  disabled={produto.estoque <= 0}
                >
                  Comprar agora
                </button>
                
                <button
                  id="detalhes_adicionar_carrinho"
                  onClick={() => aoAdicionarAoCarrinho(produto, quantidade)}
                  className="botao-neutro font-bold w-full py-2.5 rounded-lg border border-zinc-700 shadow-sm"
                  disabled={produto.estoque <= 0}
                >
                  Adicionar ao carrinho
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-400 border-t border-gray-800 pt-3">
                <span>Meios de pagamentos</span>
                <span className="flex items-center gap-1 font-semibold text-white">
                  Ã€ vista <span className="bg-[#00e676] text-black font-bold px-1.5 py-0.5 rounded text-[10px]">PIX</span>
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* SeÃ§Ã£o de Tabs (DescriÃ§Ã£o / AvaliaÃ§Ãµes) */}
        <div className="mt-8">
          <div className="flex border-b border-gray-800 gap-2 select-none mb-4">
            <button 
              id="detalhes_aba_descricao"
              onClick={() => setAbaAtiva("descricao")}
              className={`pb-2 px-4 font-bold border-b-2 transition-colors ${abaAtiva === "descricao" ? "border-[#b92cff] text-[#b92cff]" : "border-transparent text-gray-400 hover:text-white"}`}
            >
              DescriÃ§Ã£o
            </button>
            <button 
              id="detalhes_aba_avaliacoes"
              onClick={() => setAbaAtiva("avaliacoes")}
              className={`pb-2 px-4 font-bold border-b-2 transition-colors ${abaAtiva === "avaliacoes" ? "border-[#b92cff] text-[#b92cff]" : "border-transparent text-gray-400 hover:text-white"}`}
            >
              AvaliaÃ§Ãµes do produto ({totalAvaliacoes})
            </button>
          </div>

          <div className="p-2">
            {abaAtiva === "descricao" ? (
              <div className="space-y-3">
                <h3 className="font-extrabold text-[#00f0ff] mb-2">{produto.descricao.titulo}</h3>
                <ul className="space-y-2.5">
                  {produto.descricao?.detalhes?.map((detalhe, index) => (
                    <li key={index} className="flex gap-2 text-sm text-gray-300">
                      <span>âš¡</span>
                      <span>{detalhe}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
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
                    <span className="text-gray-400 text-xs">{totalAvaliacoes} avaliaÃ§Ãµes</span>
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
                    <p className="text-sm">Nenhuma avaliaÃ§Ã£o encontrada para este produto.</p>
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
    </div>
  );
}

