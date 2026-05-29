import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contextos/contexto_autenticacao";
import { useCart } from "../contextos/contexto_carrinho";
import { ServicoPedidos } from "../servicos/servico_pedidos";
import { FormatarMoeda } from "../utilitarios/formatadores";
import { ServicoCarrinho as ServicoCarrinhoObj } from "../servicos/servico_carrinho";
import { ShoppingCart, Trash2, Tag, Percent, ArrowLeft } from "lucide-react";

export default function Carrinho() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const {
    carrinho,
    carregandoCarrinho,
    cupomAplicado, aplicarCupom,
    removerDoCarrinho, atualizarQuantidade,
    limparCarrinho,
    mostrarToast
  } = useCart();

  const [cupomInput, setCupomInput] = useState(cupomAplicado);
  const [erroCupom, setErroCupom] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [porcentagemCupom, setPorcentagemCupom] = useState(0);

  useEffect(() => {
    if (cupomAplicado) {
      ServicoCarrinhoObj.carregarCupomAtivo().then(cupom => {
        if (cupom) setPorcentagemCupom(cupom.porcentagem);
      });
    }
  }, [cupomAplicado]);

  const subtotal = ServicoCarrinhoObj.calcularSubtotal(carrinho);
  const desconto = ServicoCarrinhoObj.calcularDesconto(subtotal, cupomAplicado, porcentagemCupom);
  const total = ServicoCarrinhoObj.calcularTotal(carrinho, cupomAplicado, porcentagemCupom);

  const lidarComCupom = async (e) => {
    e.preventDefault();
    if (!cupomInput.trim()) return;
    const cupom = await ServicoCarrinhoObj.carregarCupomAtivo();
    if (cupom && cupomInput.trim().toUpperCase() === cupom.codigo) {
      aplicarCupom(cupom.codigo);
      setPorcentagemCupom(cupom.porcentagem);
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
      const carrinhoComCupom = cupomAplicado
        ? carrinho.map(item => ({ ...item, cupom: cupomAplicado }))
        : carrinho;
      const res = await ServicoPedidos.criarPedidosDoCarrinho(usuario, carrinhoComCupom, total);
      if (res.sucesso && res.orders.length > 0) {
        const pedidoIds = res.orders.map(o => o.id);
        sessionStorage.setItem("nexmarket_checkout", JSON.stringify({
          pedidoIds,
          total,
          limparCarrinho: true,
          email: usuario?.email || ''
        }));
        navigate("/checkout");
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

  if (carregandoCarrinho) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingCart className="text-primary" size={24} />
          Carrinho
          {carrinho.length > 0 && (
            <span className="text-sm font-medium text-zinc-400">
              ({carrinho.reduce((sum, item) => sum + item.quantidade, 0)} {carrinho.reduce((sum, item) => sum + item.quantidade, 0) === 1 ? 'item' : 'itens'})
            </span>
          )}
        </h1>
      </div>

      {/* Conteúdo */}
      {carrinho.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
          <ShoppingCart size={48} className="text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400 mb-2">Seu carrinho está vazio</h3>
          <p className="text-zinc-500 text-sm mb-6">Adicione produtos para começar a comprar.</p>
          <Link to="/" className="botao-primario inline-flex px-6 py-2.5 text-sm font-bold">
            Voltar às compras
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Lista de itens */}
          <div className="space-y-3">
            {carrinho.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    ITEM DIGITAL
                  </span>
                  <h4 className="font-semibold text-sm text-white truncate">
                    {item.titulo}
                  </h4>
                  <span className="text-xs text-secondary font-bold block mt-1">
                    {FormatarMoeda(item.preco)} cada
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-zinc-700 rounded-lg bg-zinc-950 overflow-hidden">
                    <button
                      onClick={() => atualizarQuantidade(item.id, item.quantidade - 1, item.estoque_max)}
                      className="px-3 py-1 hover:bg-zinc-800 font-bold text-sm border-r border-zinc-700"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm font-bold min-w-[28px] text-center">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => atualizarQuantidade(item.id, item.quantidade + 1, item.estoque_max)}
                      className="px-3 py-1 hover:bg-zinc-800 font-bold text-sm border-l border-zinc-700"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removerDoCarrinho(item.id)}
                    className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg border border-red-500/30 hover:border-red-500/80 transition-colors"
                    title="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cupom */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
            <form onSubmit={lidarComCupom} className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={cupomInput}
                  onChange={(e) => setCupomInput(e.target.value)}
                  placeholder="Cupom de Desconto"
                  className="input-padrao w-full pl-9 text-sm"
                />
              </div>
              <button type="submit" className="botao-neutro text-sm px-5">
                Aplicar
              </button>
            </form>

            {erroCupom && <p className="text-red-500 text-xs font-bold">{erroCupom}</p>}

            {cupomAplicado && (
              <div className="bg-success/10 border border-success/40 p-3 rounded-lg flex justify-between items-center text-xs text-success font-bold">
                <span className="flex items-center gap-1">
                  <Percent size={14} />
                  Cupom {cupomAplicado} ativado!
                </span>
                <span>-10%</span>
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Subtotal:</span>
              <span>{FormatarMoeda(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between text-danger text-sm">
                <span>Desconto (10%):</span>
                <span>-{FormatarMoeda(desconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white text-lg border-t border-zinc-700 pt-2 mt-2">
              <span>Total:</span>
              <span className="text-secondary">{FormatarMoeda(total)}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={lidarComFinalizar}
              disabled={finalizando}
              className="botao-primario flex-1 py-3.5 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {finalizando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Finalizar Compra"
              )}
            </button>
            <button
              onClick={limparCarrinho}
              className="botao-neutro px-4 py-3.5 text-sm"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
