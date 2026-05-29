import React from "react";
import { ShoppingBag } from "lucide-react";

export default function BotaoComprar({ onClick, produtoId, className = "", semEstoque = false }) {
  const customId = `produto_comprar_${produtoId}`;

  return (
    <button
      id={customId}
      disabled={semEstoque}
      onClick={(e) => {
        e.stopPropagation();
        if (!semEstoque && onClick) onClick(e);
      }}
      className={`botao-primario font-bold uppercase w-full tracking-wider select-none ${semEstoque ? 'opacity-40 cursor-not-allowed grayscale' : ''} ${className}`}
    >
      <span>{semEstoque ? 'SEM ESTOQUE' : 'COMPRAR'}</span>
      <ShoppingBag size={18} />
    </button>
  );
}
