import React, { useState, useEffect } from "react";
import { supabase } from "../../configuracoes/supabase";
import { ServicoPagamento } from "../../servicos/servico_pagamento";
import { FormatarMoeda, FormatarTempo } from "../../utilitarios/formatadores";
import { Copy, Check, Sparkles, Award, Clock } from "lucide-react";
import confetti from "canvas-confetti";

export default function ModalPix({ 
  pedidoId,
  total,
  aoFechar,
  aoAtualizarEstoque,
  aoLimparCarrinho
}) {
  const [cobranca, setCobranca] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(300);
  const [status, setStatus] = useState("pendente"); // 'pendente', 'confirmando', 'aprovado', 'expirado'
  const [copiado, setCopiado] = useState(false);
  const [copiadoIndice, setCopiadoIndice] = useState(null);
  const [pedidoAtualizado, setPedidoAtualizado] = useState(null);

  useEffect(() => {
    if (pedidoId && total) {
      (async () => {
        try {
          const novaCobranca = await ServicoPagamento.criarCobrancaPix(pedidoId, total);
          setCobranca(novaCobranca);
          setTempoRestante(novaCobranca.expiraEmSegundos);
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [pedidoId, total]);

  // Timer
  useEffect(() => {
    if (status !== "pendente") return;
    if (tempoRestante <= 0) {
      setStatus("expirado");
      return;
    }
    const intervalo = setInterval(() => {
      setTempoRestante((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [tempoRestante, status]);

  const lidarComCopia = () => {
    if (!cobranca) return;
    navigator.clipboard.writeText(cobranca.chaveCopiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const lidarComCopiaCredencial = (texto, idx) => {
    navigator.clipboard.writeText(texto);
    setCopiadoIndice(idx);
    setTimeout(() => setCopiadoIndice(null), 2000);
  };

  const lidarComConfirmacao = async () => {
    if (!cobranca) return;
    setStatus("confirmando");

    try {
      // Confirma no banco (aprova pagamento + despacha automÃ¡tica)
      const res = await ServicoPagamento.confirmarPagamento(pedidoId);
      if (res.sucesso) {
        // Busca o pedido atualizado para ver o resultado da entrega
        const { data: compra, error } = await supabase
          .from('compras')
          .select('*')
          .eq('id', pedidoId)
          .maybeSingle();

        if (!error && compra) {
          setPedidoAtualizado(compra);
        }
        
        setStatus("aprovado");
        aoLimparCarrinho();

        // Solta confetes
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#b92cff", "#00f0ff", "#ffe600", "#00e676"]
        });
      } else {
        setStatus("pendente");
        alert("Erro na simulaÃ§Ã£o do banco.");
      }
    } catch (err) {
      console.error(err);
      setStatus("pendente");
    }
  };

  return (
    <div 
      id="modal_pix_overlay"
      className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={status === "aprovado" ? undefined : aoFechar}
    >
      <div 
        id="modal_pix"
        className="card-padrao w-full max-w-lg bg-[#0d091e] border border-zinc-800 text-white p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {status !== "aprovado" && (
          <button 
            onClick={aoFechar}
            className="absolute top-4 right-4 bg-black border border-zinc-700 hover:bg-gray-900 rounded-lg p-1.5 transition-colors"
          >
            âœ•
          </button>
        )}

        {/* 1. PENDENTE */}
        {status === "pendente" && cobranca && (
          <div className="text-center space-y-5">
            <h2 className="fonte-cartoon text-xl text-[#00f0ff] uppercase glow-azul tracking-wider">
              Ãrea de Pagamento PIX
            </h2>
            <p className="text-xs text-gray-400">
              ID da TransaÃ§Ã£o: <span className="font-semibold text-white">{pedidoId}</span>
            </p>

            {/* QR Code */}
            <div className="mx-auto w-[200px] h-[200px] bg-white border-4 border-black p-2 rounded-2xl shadow-[4px_4px_0px_#b92cff] flex items-center justify-center">
              <img 
                src={cobranca.qrCodeBase64} 
                alt="QR Code Pix" 
                className="w-full h-full select-none" 
              />
            </div>

            {/* Valor total e timer */}
            <div className="bg-[#120e2a] border border-zinc-700 p-4 rounded-xl shadow-sm flex justify-between items-center max-w-xs mx-auto">
              <div className="text-left">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Valor a pagar</span>
                <span className="text-[#00e676] font-black text-lg">{FormatarMoeda(total)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Expira em</span>
                <span className="text-[#ff2a74] font-black text-base font-mono">
                  {FormatarTempo(tempoRestante)}
                </span>
              </div>
            </div>

            {/* Copia e Cola */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase block">Chave Pix Copia e Cola</label>
              <div className="flex border border-zinc-700 rounded-lg overflow-hidden bg-[#0d091e] shadow-sm max-w-sm mx-auto">
                <input 
                  type="text" 
                  readOnly 
                  value={cobranca.chaveCopiaCola} 
                  className="bg-transparent px-3 py-2 text-xs flex-1 text-gray-400 select-all outline-none"
                />
                <button 
                  onClick={lidarComCopia}
                  className="bg-[#b92cff] text-white px-3 hover:bg-[#a624e5] border-l-2 border-black transition-colors flex items-center justify-center"
                >
                  {copiado ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* SimulaÃ§Ã£o */}
            <div className="pt-2">
              <button
                onClick={lidarComConfirmacao}
                className="botao-sucesso w-full max-w-xs py-3 text-sm font-extrabold uppercase shadow-sm"
              >
                Simular Pagamento (Confirmar)
              </button>
            </div>
          </div>
        )}

        {/* 2. CONFIRMANDO */}
        {status === "confirmando" && (
          <div className="text-center py-12 space-y-6 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <h3 className="fonte-cartoon text-base text-white uppercase tracking-wider">
              Aguardando Banco...
            </h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Processando a confirmaÃ§Ã£o do pagamento no Supabase. Aguarde alguns instantes.
            </p>
          </div>
        )}

        {/* 3. APROVADO */}
        {status === "aprovado" && (
          <div className="text-center space-y-5">
            <div className="inline-flex p-3 bg-[#00e676]/20 border-2 border-[#00e676] rounded-full text-[#00e676] mb-1 animate-bounce">
              <Award size={36} />
            </div>
            
            <h2 className="fonte-cartoon text-lg text-[#00e676] uppercase tracking-wider glow-verde">
              Pagamento Aprovado!
            </h2>

            {pedidoAtualizado?.status === 'ENTREGUE' ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Sua entrega digital foi realizada com sucesso! ðŸŽ‰
                </p>

                <div className="bg-[#120e2a] border border-zinc-800 rounded-xl p-4 text-left shadow-md max-h-[220px] overflow-y-auto space-y-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block border-b border-gray-800 pb-1.5">
                    ðŸ”‘ Suas chaves / acessos:
                  </span>
                  <div className="space-y-2">
                    {(pedidoAtualizado.deliveryContent || []).map((cred, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between gap-2 bg-[#0d091e] border border-gray-800 p-2 rounded-lg text-xs"
                      >
                        <code className="text-[#00e676] select-all break-all pr-2 font-mono">
                          {cred}
                        </code>
                        <button
                          onClick={() => lidarComCopiaCredencial(cred, idx)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          {copiadoIndice === idx ? <Check size={14} className="text-[#00e676]" /> : <Copy size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-[#120e2a] border border-zinc-700 p-4 rounded-xl text-left">
                <div className="flex items-center gap-2 text-[#ffe600] font-bold text-xs mb-1">
                  <Clock size={16} />
                  <span>Aguardando Envio Manual</span>
                </div>
                <p className="text-xs text-gray-300">
                  Este produto necessita de entrega manual. O administrador da NexMarket foi notificado e enviarÃ¡ suas chaves em breve.
                </p>
                <p className="text-[10px] text-gray-400">
                  VocÃª pode acompanhar a entrega e resgatar suas chaves acessando a aba <strong>Meus Pedidos</strong> no seu perfil.
                </p>
              </div>
            )}

            <button
              onClick={aoFechar}
              className="botao-primario w-full py-3 text-sm font-extrabold uppercase shadow-sm"
            >
              Concluir e Fechar
            </button>
          </div>
        )}

        {/* 4. EXPIRADO */}
        {status === "expirado" && (
          <div className="text-center py-8 space-y-5">
            <h2 className="fonte-cartoon text-xl text-[#ff2a74] uppercase tracking-wider">
              PIX Expirado
            </h2>
            <button 
              onClick={aoFechar}
              className="botao-neutro w-full max-w-xs py-2.5 text-sm"
            >
              Fechar Janela
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

