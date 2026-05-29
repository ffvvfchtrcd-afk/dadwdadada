import React, { useMemo } from "react";
import ImagemProduto from "./imagem_produto";
import BotaoComprar from "./botoes/botao_comprar";
import { FormatarMoeda } from "../utilitarios/formatadores";
import { Zap, ShoppingBag, AlertTriangle, Package } from "lucide-react";

export default function CardProduto({ produto, aoClicar, aoComprarImediato, aoAdicionarAoCarrinho }) {
  const isManual = produto.estoque_tipo && produto.estoque_tipo !== 'AUTOMATICA' && produto.estoque_tipo !== 'AGENTE';
  const semEstoque = !isManual && (produto.estoque || 0) <= 0;

  const fotoUrl = useMemo(() => {
    return produto.bannerUrl || produto.variacoes?.[0]?.imagem_url || null;
  }, [produto.bannerUrl, produto.variacoes]);

  return (
    <div 
      id={`card_produto_${produto.id}`}
      onClick={() => {
        if (!semEstoque) aoClicar(produto);
      }}
      className={`card-padrao group flex flex-col justify-between h-full overflow-hidden cursor-pointer relative ${semEstoque ? 'opacity-70 grayscale-[30%]' : ''}`}
    >
      
      {/* Top Banner on Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        {fotoUrl ? (
          <img src={fotoUrl} alt={produto.titulo} className="w-full h-full object-cover" />
        ) : (
          <ImagemProduto produtoId={produto.id} />
        )}
        
        <div className="absolute top-2 left-2 flex gap-1.5 items-center bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm">
          {isManual ? (
            <><Package size={12} className="text-amber-400" /><span className="text-amber-400">ENTREGA MANUAL</span></>
          ) : (
            <><Zap size={12} className="text-secondary" /><span className="text-secondary">ENTREGA AUTOMÁTICA</span></>
          )}
        </div>

        {semEstoque && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-danger text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
              <AlertTriangle size={14} />
              Esgotado
            </span>
          </div>
        )}

        {!semEstoque && produto.desconto > 0 && (
          <div className="absolute top-2 right-2 bg-danger border border-rose-400/50 px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-sm">
            {produto.desconto}% OFF
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        
        {/* Title */}
        <div className="mb-4">
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest block mb-1">
            {produto.categoria}
          </span>
          <h3 className="font-semibold text-sm md:text-base text-zinc-100 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {produto.titulo}
          </h3>
        </div>

        {/* Pricing & Call to Actions */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-0.5 select-none min-h-[20px]">
            {produto.precoOriginal > produto.precoAtual && (
              <span className="text-zinc-500 line-through text-xs font-medium">
                {FormatarMoeda(produto.precoOriginal)}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-baseline gap-1 select-none">
              <span className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-1">
                {FormatarMoeda(produto.precoAtual)}
              </span>
            </div>
          </div>
          
          <span className="text-[10px] text-zinc-500 font-medium uppercase block mb-4 select-none">
            À vista no PIX
          </span>

          {/* Action Buttons */}
          <div className="flex gap-2 relative z-10">
            <div className="flex-1">
              <div onClick={(e) => e.stopPropagation()}>
                <BotaoComprar 
                  produtoId={produto.id} 
                  semEstoque={semEstoque}
                  onClick={() => aoComprarImediato(produto)} 
                />
              </div>
            </div>
            
            <button
              id={`carrinho_adicionar_rapido_${produto.id}`}
              disabled={semEstoque}
              onClick={(e) => {
                e.stopPropagation();
                if (!semEstoque) aoAdicionarAoCarrinho(produto, 1);
              }}
              className={`p-2.5 px-3 flex items-center justify-center ${semEstoque ? 'botao-neutro opacity-30 cursor-not-allowed' : 'botao-neutro hover:text-white hover:border-zinc-500'}`}
              title={semEstoque ? "Produto esgotado" : "Adicionar ao carrinho"}
            >
              <ShoppingBag size={18} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
