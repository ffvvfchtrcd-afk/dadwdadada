import React from "react";
import { Plus } from "lucide-react";

export default function BotaoCarrinho({ onClick, produtoId, className = "" }) {
  const customId = `carrinho_adicionar_${produtoId}`;

  return (
    <button
      id={customId}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      className={`botao-neutro font-bold uppercase w-full tracking-wider select-none ${className}`}
    >
      <span>Adicionar ao carrinho</span>
      <Plus size={18} />
    </button>
  );
}

