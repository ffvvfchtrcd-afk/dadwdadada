import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../configuracoes/supabase";
import { ServicoPagamento } from "../servicos/servico_pagamento";
import { useCart } from "../contextos/contexto_carrinho";
import { FormatarMoeda, FormatarTempo } from "../utilitarios/formatadores";
import { Check, Copy, Award, Clock, ShieldCheck, Package, Zap, User, ChevronLeft, ShoppingBag, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

const ETAPAS = [
  { id: "revisao", label: "Revisar Pedido" },
  { id: "pagamento", label: "Pagamento" },
  { id: "confirmacao", label: "Confirmação" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { limparCarrinho } = useCart();
  const [etapa, setEtapa] = useState("revisao");
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [cobranca, setCobranca] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(300);
  const [copiado, setCopiado] = useState(false);
  const [copiadoIndice, setCopiadoIndice] = useState(null);
  const [statusPix, setStatusPix] = useState("pendente");

  const checkoutData = JSON.parse(sessionStorage.getItem("nexmarket_checkout") || "null");

  useEffect(() => {
    if (!checkoutData) { navigate("/"); return; }
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setCarregando(true);
      const ids = checkoutData.pedidoIds;
      if (!ids || ids.length === 0) { navigate("/"); return; }

      const { data: compras, error } = await supabase
        .from("compras")
        .select("*")
        .in("id", ids);

      if (error) throw error;
      setPedidos(compras || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const [tokenConfigurado, setTokenConfigurado] = useState(true);

  const iniciarPagamento = async () => {
    const primeiroId = checkoutData.pedidoIds[0];
    try {
      const novaCobranca = await ServicoPagamento.criarCobrancaPix(primeiroId, checkoutData.total, checkoutData.email);
      setCobranca(novaCobranca);
      setTempoRestante(novaCobranca.expiraEmSegundos);
      setEtapa("pagamento");
    } catch (err) {
      setTokenConfigurado(false);
    }
  };

  useEffect(() => {
    if (etapa !== "pagamento" || statusPix !== "pendente") return;
    if (tempoRestante <= 0) { setStatusPix("expirado"); return; }
    const i = setInterval(() => setTempoRestante(p => p - 1), 1000);
    return () => clearInterval(i);
  }, [etapa, tempoRestante, statusPix]);

  useEffect(() => {
    if (!cobranca?.id || etapa !== "pagamento" || statusPix !== "pendente") return;
    const poll = setInterval(async () => {
      const res = await ServicoPagamento.verificarPagamento(cobranca.id);
      if (res.approved) {
        clearInterval(poll);
        confirmarAprovado();
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [cobranca?.id, etapa, statusPix]);

  const confirmarAprovado = async () => {
    setStatusPix("confirmando");
    try {
      const ids = checkoutData.pedidoIds;
      for (const id of ids) {
        await ServicoPagamento.confirmarPagamento(id);
      }

      const { data: compras } = await supabase
        .from("compras")
        .select("*")
        .in("id", ids);

      setPedidos(compras || []);

      if (checkoutData.limparCarrinho) {
        try { limparCarrinho(); } catch {}
      }

      setStatusPix("aprovado");
      setEtapa("confirmacao");
      sessionStorage.removeItem("nexmarket_checkout");

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#b92cff", "#00f0ff", "#ffe600", "#00e676"] });
    } catch (err) {
      console.error(err);
      setStatusPix("pendente");
    }
  };

  const confirmarPagamento = async () => {
    setStatusPix("confirmando");
    try {
      const ids = checkoutData.pedidoIds;
      for (const id of ids) {
        await ServicoPagamento.confirmarPagamento(id);
      }

      const { data: compras } = await supabase
        .from("compras")
        .select("*")
        .in("id", ids);

      setPedidos(compras || []);

      if (checkoutData.limparCarrinho) {
        try { limparCarrinho(); } catch {}
      }

      setStatusPix("aprovado");
      setEtapa("confirmacao");
      sessionStorage.removeItem("nexmarket_checkout");

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#b92cff", "#00f0ff", "#ffe600", "#00e676"] });
    } catch (err) {
      console.error(err);
      setStatusPix("pendente");
    }
  };

  const copiarChave = () => {
    if (!cobranca) return;
    navigator.clipboard.writeText(cobranca.chaveCopiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const copiarCredencial = (texto, idx) => {
    navigator.clipboard.writeText(texto);
    setCopiadoIndice(idx);
    setTimeout(() => setCopiadoIndice(null), 2000);
  };

  const badgeMetodo = (metodo) => {
    const isAuto = metodo === "AUTOMATICA";
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
        isAuto ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400"
      }`}>
        {isAuto ? <Zap size={12} /> : <Package size={12} />}
        {isAuto ? "ENTREGA AUTOMÁTICA" : "ENTREGA MANUAL"}
      </span>
    );
  };

  const badgeStatus = (status) => {
    const map = {
      ENTREGUE: "bg-emerald-500/20 text-emerald-400",
      AGUARDANDO_PAGAMENTO: "bg-amber-500/20 text-amber-400",
      CANCELADO: "bg-rose-500/20 text-rose-400",
      PROCESSANDO: "bg-cyan-500/20 text-cyan-400",
      PENDENTE_SUPORTE: "bg-orange-500/20 text-orange-400",
    };
    return (
      <span className={`${map[status] || "bg-zinc-800 text-zinc-400"} px-2 py-0.5 rounded text-[10px] font-bold`}>
        {status === "ENTREGUE" ? "Entregue" : status === "AGUARDANDO_PAGAMENTO" ? "Aguardando PIX" : status === "PENDENTE_SUPORTE" ? "Aguardando Admin" : status}
      </span>
    );
  };

  // Stats
  const totalEntregues = pedidos.filter(p => p.status === "ENTREGUE").length;
  const totalPendentes = pedidos.filter(p => p.status === "PENDENTE_SUPORTE" || p.status === "PROCESSANDO").length;

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-zinc-500 font-medium">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <ShoppingBag size={48} className="text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nada para finalizar</h3>
          <Link to="/" className="botao-primario inline-block mt-4 text-xs px-6 py-2">Ir às Compras</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => etapa === "revisao" ? navigate("/carrinho") : setEtapa("revisao")} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Checkout</h1>
          <p className="text-[10px] text-zinc-500 mt-0.5">Finalize sua compra em poucos passos</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {ETAPAS.map((e, i) => {
          const ativa = etapa === e.id;
          const concluida = ETAPAS.findIndex(x => x.id === etapa) > i;
          return (
            <React.Fragment key={e.id}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  ativa ? "bg-primary text-white ring-2 ring-primary/30" :
                  concluida ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {concluida ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                  ativa ? "text-white" : concluida ? "text-emerald-400" : "text-zinc-500"
                }`}>{e.label}</span>
              </div>
              {i < ETAPAS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${concluida ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: Revisão */}
      {etapa === "revisao" && (
        <div className="space-y-6">
          <div className="card-padrao p-5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag size={16} className="text-primary" />
              Itens do Pedido ({pedidos.length})
            </h2>
            <div className="space-y-3">
              {pedidos.map((item, idx) => {
                const isAuto = item.metodoEntrega === "AUTOMATICA";
                return (
                  <div key={item.id || idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-white truncate">{item.productName || "Produto"}</span>
                          {badgeMetodo(item.metodoEntrega)}
                          {item.variationName && item.variationName !== "Opção Padrão" && (
                            <span className="text-[10px] text-cyan-400 font-mono">({item.variationName})</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 space-y-0.5 mt-1">
                          <p>Quantidade: <strong className="text-zinc-200">{item.quantity || 1}x</strong></p>
                          <p>Valor: <strong className="text-emerald-400">{FormatarMoeda(item.total || 0)}</strong></p>
                          {!isAuto && (
                            <p className="flex items-center gap-1 text-amber-400 mt-1">
                              <Package size={12} />
                              <span>Estoque ilimitado — entrega será feita pelo administrador</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-padrao p-5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Resumo</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Itens</span>
                <span>{pedidos.length} produto(s)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{FormatarMoeda(pedidos.reduce((s, i) => s + (i.total || 0), 0))}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Método</span>
                <span className="text-cyan-400">PIX</span>
              </div>
              <div className="flex justify-between font-bold text-white text-lg border-t border-zinc-700 pt-3 mt-3">
                <span>Total</span>
                <span className="text-emerald-400">{FormatarMoeda(checkoutData.total)}</span>
              </div>
            </div>
          </div>

          <button onClick={iniciarPagamento} className="botao-primario w-full py-3.5 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            Ir para Pagamento — {FormatarMoeda(checkoutData.total)}
          </button>
        </div>
      )}

      {/* STEP 2: Pagamento PIX */}
      {etapa === "pagamento" && (
        <div className="card-padrao p-6">
          {statusPix === "pendente" && cobranca && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1">Pagamento PIX</h2>
                <p className="text-[10px] text-zinc-500">Escaneie o QR Code ou copie a chave para pagar</p>
              </div>

              <div className="mx-auto w-[180px] h-[180px] bg-white border-3 border-black p-2 rounded-2xl shadow-[4px_4px_0px_#b92cff] flex items-center justify-center">
                {cobranca.qrCodeBase64 ? (
                  <img src={`data:image/png;base64,${cobranca.qrCodeBase64}`} alt="QR Code Pix" className="w-full h-full select-none" />
                ) : (
                  <div className="text-zinc-400 text-xs text-center px-2">
                    <p className="font-bold mb-1">PIX</p>
                    <p>Copie a chave abaixo</p>
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center max-w-xs mx-auto">
                <div className="text-left">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Valor</span>
                  <span className="text-emerald-400 font-black text-lg">{FormatarMoeda(checkoutData.total)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Expira</span>
                  <span className="text-rose-400 font-black text-base font-mono">{FormatarTempo(tempoRestante)}</span>
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">Chave PIX Copia e Cola</label>
                <div className="flex border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950">
                  <input type="text" readOnly value={cobranca.chaveCopiaCola} className="bg-transparent px-3 py-2 text-xs flex-1 text-zinc-400 select-all outline-none font-mono" />
                  <button onClick={copiarChave} className="bg-primary text-white px-3 hover:bg-primary/80 transition-colors">
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left text-xs text-zinc-400 space-y-1">
                <p className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1"><ShieldCheck size={14} /> Pagamento via Mercado Pago</p>
                <p>Após o pagamento, a confirmação é automática. O PIX é processado em até 30 segundos.</p>
              </div>

              <p className="text-[10px] text-zinc-500">Aguardando pagamento... O QR Code atualiza automaticamente.</p>
            </div>
          )}

          {!tokenConfigurado && (
            <div className="card-padrao p-6 text-center space-y-4">
              <AlertTriangle size={40} className="mx-auto text-warning" />
              <h3 className="text-sm font-bold text-warning uppercase">Mercado Pago não configurado</h3>
              <p className="text-xs text-zinc-400">O token de acesso do Mercado Pago não foi definido nas variáveis de ambiente.</p>
              <button onClick={() => navigate("/carrinho")} className="botao-neutro text-xs">Voltar</button>
            </div>
          )}

          {statusPix === "confirmando" && (
            <div className="text-center py-16 space-y-6">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Processando Pagamento</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">Aguardando confirmação bancária. Isso leva apenas alguns segundos.</p>
            </div>
          )}

          {statusPix === "expirado" && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                <Clock size={32} className="text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Tempo Expirado</h3>
              <p className="text-xs text-zinc-500">O QR Code PIX expirou. Volte ao carrinho e tente novamente.</p>
              <button onClick={() => navigate("/carrinho")} className="botao-neutro text-xs">Voltar ao Carrinho</button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Confirmação */}
      {etapa === "confirmacao" && (
        <div className="text-center space-y-6">
          <div className="inline-flex p-3 bg-emerald-500/20 border-2 border-emerald-500 rounded-full text-emerald-400 animate-bounce">
            <Award size={36} />
          </div>

          <h2 className="text-base font-bold text-emerald-400 uppercase tracking-wider">Pagamento Aprovado!</h2>

          {/* Summary bar */}
          {pedidos.length > 1 && (
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
              <span>{pedidos.length} item(ns)</span>
              {totalEntregues > 0 && <span className="text-emerald-400">{totalEntregues} entregue(s)</span>}
              {totalPendentes > 0 && <span className="text-amber-400">{totalPendentes} pendente(s)</span>}
            </div>
          )}

          <div className="card-padrao p-5 text-left space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Detalhes da Compra</span>
            </div>
            {pedidos.map((item, idx) => {
              const isEntregue = item.status === "ENTREGUE";
              const isPendente = item.status === "PENDENTE_SUPORTE" || item.status === "PROCESSANDO";
              return (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{item.productName}</span>
                    {item.variationName && item.variationName !== "Opção Padrão" && (
                      <span className="text-[10px] text-cyan-400 font-mono">({item.variationName})</span>
                    )}
                    {badgeMetodo(item.metodoEntrega)}
                    {badgeStatus(item.status)}
                  </div>

                  {isEntregue && item.deliveryContent?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Suas Credenciais</span>
                      {item.deliveryContent.map((cred, cIdx) => (
                        <div key={cIdx} className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                          <code className="text-xs text-emerald-400 select-all break-all font-mono flex-1">{cred}</code>
                          <button onClick={() => copiarCredencial(cred, cIdx)} className="text-zinc-500 hover:text-white p-1 flex-shrink-0">
                            {copiadoIndice === cIdx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isPendente && (
                    <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 flex items-start gap-2">
                      <Package size={14} className="mt-0.5" />
                      <div>
                        <p className="font-bold">Entrega Manual</p>
                        <p className="text-zinc-400 mt-0.5">O administrador será notificado e enviará suas credenciais em breve. Acompanhe em Meus Pedidos.</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-[10px] text-zinc-500">
                    <span>Pedido: <code className="text-zinc-300 font-mono">{item.id}</code></span>
                    <span className="mx-2">•</span>
                    <span>Valor: <strong className="text-emerald-400">{FormatarMoeda(item.total || 0)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          <Link to="/perfil" className="botao-primario w-full py-3 text-sm font-extrabold uppercase inline-flex items-center justify-center gap-2">
            <User size={16} /> Ver Meus Pedidos
          </Link>

          <Link to="/" className="block text-xs text-zinc-500 hover:text-white transition-colors">Continuar Comprando</Link>
        </div>
      )}
    </div>
  );
}
