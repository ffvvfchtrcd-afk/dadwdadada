import React from "react";
import { X } from "lucide-react";

export default function BotaoFechar({ onClick, modalId = "modal", className = "" }) {
  const customId = `${modalId}_fechar`;

  return (
    <button
      id={customId}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      className={`btn-base bg-white text-zinc-900 hover:bg-gray-200 shadow-sm p-2 rounded-full border border-zinc-700 hover:bg-red-500 hover:text-white transition-colors duration-150 select-none ${className}`}
      aria-label="Fechar"
    >
      <X size={18} />
    </button>
  );
}

