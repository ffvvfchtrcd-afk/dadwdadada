import React from "react";
import CardProduto from "./card_produto";

const GradeProdutos = React.memo(function GradeProdutos({ produtos, aoSelecionarProduto, aoComprarImediato, aoAdicionarAoCarrinho }) {
  return (
    <div 
      id="grade_produtos"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4 max-w-7xl mx-auto"
    >
      {produtos.map((prod) => (
        <CardProduto
          key={prod.id}
          produto={prod}
          aoClicar={aoSelecionarProduto}
          aoComprarImediato={aoComprarImediato}
          aoAdicionarAoCarrinho={aoAdicionarAoCarrinho}
        />
      ))}
    </div>
  );
});

export default GradeProdutos;
