import React, { useState } from "react";
import BotaoFechar from "../botoes/botao_fechar";
import { useAuth } from "../../contextos/contexto_autenticacao";
import { ServicoCarrinho } from "../../servicos/servico_carrinho";
import { ServicoPedidos } from "../../servicos/servico_pedidos";
import { FormatarMoeda } from "../../utilitarios/formatadores";
import { CONFIGURACOES } from "../../configuracoes/config";
import { ShoppingCart, Trash2, Tag, Percent } from "lucide-react";

export default function ModalCarrinho({ 
  carrinho, 
  aoFechar, 
  aoAtualizarQuantidade, 
  aoRemoverItem, 
  aoFinalizarCompra,
  cupomAplicado,
  aoAplicarCupom
}) {
  const { usuario } = useAuth();
  const [cupomInput, setCupomInput] = useState(cupomAplicado);
  const [erroCupom, setErroCupom] = useState("");
  const [finalizando, setFinalizando] = useState(false);

  const subtotal = ServicoCarrinho.calcularSubtotal(carrinho);
  const desconto = ServicoCarrinho.calcularDesconto(subtotal, cupomAplicado);
  const total = ServicoCarrinho.calcularTotal(carrinho, cupomAplicado);

  const lidarComCupom = (e) => {
    e.preventDefault();
    if (cupomInput.trim().toUpperCase() === CONFIGURACOES.cupomDesconto.codigo) {
      aoAplicarCupom(cupomInput.trim().toUpperCase());
      setErroCupom("");
    } else {
      setErroCupom("Cupom inválido!");
    }
  };

  const lidarComFinalizar = async () => {
    if (!usuario) {
      alert("Você precisa fazer login para finalizar a compra.");
      return;
    }

    setFinalizando(true);
    try {
      const res = await ServicoPedidos.criarPedidosDoCarrinho(usuario, carrinho, total);
      if (res.sucesso && res.orders.length > 0) {
        // Envia o primeiro ID criado para exibição no Pix
        const pedidoCriado = res.orders[0];
        aoFinalizarCompra(pedidoCriado.id, total);
      } else {
        alert(res.message || "Erro ao criar pedido no banco de dados.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de rede ao conectar ao Supabase.");
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <div 
      id="modal_carrinho_overlay"
      className="fixed inset-0 modal-overlay z-50 flex justify-end"
      onClick={aoFechar}
    >
      <div 
        id="modal_carrinho"
        className="w-full max-w-md bg-[#0d091e] border-l-3 border-black text-white p-6 relative h-full flex flex-col justify-between shadow-[-5px_0_0_#000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecalho do carrinho */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="fonte-cartoon text-lg flex items-center gap-2 text-white">
              <ShoppingCart className="text-[#b92cff]" />
              Carrinho ({carrinho.reduce((sum, item) => sum + item.quantidade, 0)})
            </h2>
            <BotaoFechar onClick={aoFechar} modalId="carrinho" />
          </div>

          {/* Lista de itens */}
          {carrinho.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-4 border-2 border-dashed border-gray-800 rounded-xl mt-6">
              <ShoppingCart size={48} className="text-gray-600 animate-bounce" />
              <p className="text-gray-400 text-sm">Seu carrinho está vazio.</p>
              <button 
                onClick={aoFechar}
                className="botao-secundario text-xs mt-2"
              >
                Voltar às compras
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {carrinho.map((item) => (
                  <div 
                  key={item.id}
                  className="flex justify-between items-center gap-4 bg-[#120e2a] border border-zinc-700 p-3 rounded-xl shadow-sm"
                >
                  {item.imagem_url && (
                    <img src={item.imagem_url} alt="" className="w-12 h-12 object-cover rounded-lg border border-zinc-700 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">
                      ITEM DIGITAL
                    </span>
                    <h4 className="font-extrabold text-sm text-white line-clamp-1">
                      {item.titulo}
                    </h4>
                    <span className="text-xs text-[#00f0ff] font-bold block mt-1">
                      {FormatarMoeda(item.preco)} cada
                    </span>
                  </div>

                  {/* Ações de Quantidade */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center border border-black rounded-lg bg-[#0d091e] overflow-hidden">
                      <button 
                        onClick={() => aoAtualizarQuantidade(item.id, item.quantidade - 1, item.estoque_max)}
                        className="px-2 py-0.5 hover:bg-gray-800 font-extrabold border-r border-black text-xs"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold min-w-[24px] text-center">
                        {item.quantidade}
                      </span>
                      <button 
                        onClick={() => aoAtualizarQuantidade(item.id, item.quantidade + 1, item.estoque_max)}
                        className="px-2 py-0.5 hover:bg-gray-800 font-extrabold border-l border-black text-xs"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => aoRemoverItem(item.id)}
                      className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded border border-red-500/30 hover:border-red-500/80 transition-colors"
                      title="Remover produto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo Financeiro e Checkout */}
        {carrinho.length > 0 && (
          <div className="border-t-2 border-black pt-4 mt-4 space-y-4">
            
            {/* Campo do Cupom */}
            <form onSubmit={lidarComCupom} className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  id="carrinho_cupom_input"
                  type="text" 
                  value={cupomInput}
                  onChange={(e) => setCupomInput(e.target.value)}
                  placeholder="Cupom de Desconto" 
                  className="input-padrao w-full pl-9 text-xs"
                />
              </div>
              <button 
                id="carrinho_cupom_aplicar"
                type="submit"
                className="botao-neutro text-xs border-2"
              >
                Aplicar
              </button>
            </form>
            
            {erroCupom && <p className="text-red-500 text-xs font-bold">{erroCupom}</p>}
            {cupomAplicado && (
              <div className="bg-[#0c1f17] border border-[#00e676]/40 p-2 rounded-lg flex justify-between items-center text-xs text-[#00e676] font-bold">
                <span className="flex items-center gap-1">
                  <Percent size={14} />
                  Cupom {cupomAplicado} Ativado!
                </span>
                <span>-10%</span>
              </div>
            )}

            {/* Totais */}
            <div className="space-y-1.5 text-sm bg-[#120e2a] border border-zinc-700 p-3 rounded-xl shadow-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal:</span>
                <span>{FormatarMoeda(subtotal)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-[#ff2a74]">
                  <span>Desconto (10%):</span>
                  <span>-{FormatarMoeda(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-white text-base border-t border-gray-800 pt-1.5 mt-1.5">
                <span>Total:</span>
                <span className="text-[#00f0ff]">{FormatarMoeda(total)}</span>
              </div>
            </div>

            {/* Finalizar Compra */}
            <button
              id="carrinho_finalizar_compra"
              onClick={lidarComFinalizar}
              disabled={finalizando}
              className="botao-primario w-full py-3 text-sm tracking-wider uppercase font-extrabold shadow-sm flex items-center justify-center gap-2"
            >
              {finalizando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Finalizar Compra"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

