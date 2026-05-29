import React, { useEffect, useState } from 'react';
import { useAuth } from '../contextos/contexto_autenticacao';
import { ServicoPedidos } from '../servicos/servico_pedidos';
import { ServicoPagamento } from '../servicos/servico_pagamento';
import { FormatarMoeda } from '../utilitarios/formatadores';
import { Clipboard, CheckCircle, Package, Clock, ShieldAlert } from 'lucide-react';
import ModalPix from '../componentes/modais/modal_pix';

export default function MeusPedidos() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [copiadoId, setCopiadoId] = useState(null);
  const [pixAbertoId, setPixAbertoId] = useState(null);
  const [pixTotal, setPixTotal] = useState(0);

  const carregarPedidos = async () => {
    if (!usuario) return;
    try {
      setCarregando(true);
      const data = await ServicoPedidos.obterPedidosDoUsuario(usuario.id);
      setPedidos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, [usuario]);

  const copiarChave = (texto, itemId) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(itemId);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const obterBadgeStatus = (status) => {
    switch (status) {
      case 'ENTREGUE':
        return <span className="bg-[#00e676] border border-zinc-700 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">Entregue</span>;
      case 'AGUARDANDO_PAGAMENTO':
        return <span className="bg-[#ffe600] border border-zinc-700 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">Aguardando Pagamento</span>;
      case 'CANCELADO':
        return <span className="bg-[#ff2a74] border border-zinc-700 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">Cancelado</span>;
      case 'PROCESSANDO':
      case 'PENDENTE_SUPORTE':
        return <span className="bg-[#00f0ff] border border-zinc-700 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">Aguardando Suporte</span>;
      default:
        return <span className="bg-gray-600 border border-zinc-700 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">{status}</span>;
    }
  };

  if (!usuario) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="text-[#ff2a74] mx-auto mb-4" size={48} />
        <h3 className="fonte-cartoon text-lg text-white mb-2">Faça Login para Acessar</h3>
        <p className="text-gray-400 text-xs">Você precisa estar logado para ver seus pedidos anteriores.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="fonte-cartoon text-lg md:text-xl text-white uppercase tracking-wider glow-roxo">
          ðŸ“¦ Meus Pedidos
        </h2>
        <button 
          onClick={carregarPedidos}
          className="botao-neutro text-xs"
        >
          Atualizar Lista
        </button>
      </div>

      {carregando ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-[#b92cff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cartoon text-xs text-gray-400">CARREGANDO PEDIDOS...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20 border-3 border-dashed border-gray-800 rounded-3xl bg-[#0d091e]">
          <Package className="text-gray-600 mx-auto mb-4" size={40} />
          <h3 className="fonte-cartoon text-base text-gray-400 mb-1">Nenhum pedido realizado</h3>
          <p className="text-gray-500 text-xs">Suas compras digitais aparecerão catalogadas aqui.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <div 
              key={pedido.id}
              className="card-padrao p-6 bg-[#0d091e] border border-zinc-800 text-white"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-800 pb-4 mb-4">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">PEDIDO ID</span>
                  <span className="font-cartoon text-sm text-[#00f0ff]">{pedido.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {obterBadgeStatus(pedido.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="fonte-cartoon text-sm text-white mb-2">{pedido.productName}</h4>
                  <p className="text-xs text-gray-400 mb-1">
                    Variação: <strong className="text-gray-200">{pedido.variationName}</strong>
                  </p>
                  <p className="text-xs text-gray-400 mb-1">
                    Quantidade: <strong className="text-gray-200">{pedido.quantity}x</strong>
                  </p>
                  <p className="text-xs text-gray-400 mb-1">
                    Total pago: <strong className="text-gray-200">{FormatarMoeda(pedido.total)}</strong>
                  </p>
                  <p className="text-xs text-gray-400 mb-1">
                    Data: <strong className="text-gray-200">{new Date(pedido.dateCreated || pedido.date).toLocaleString('pt-BR')}</strong>
                  </p>
                </div>

                <div className="bg-[#120e2a] border border-zinc-700 rounded-xl p-4 flex flex-col justify-between">
                  {pedido.status === 'ENTREGUE' ? (
                    <div>
                      <span className="text-[9px] text-[#00e676] font-bold block uppercase tracking-wider mb-2">ðŸ”‘ Credenciais Entregues:</span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {(pedido.deliveryContent || []).map((cred, idx) => (
                          <div 
                            key={idx}
                            className="bg-black/50 border border-gray-800 rounded p-2 text-xs flex justify-between items-center gap-2"
                          >
                            <span className="font-mono break-all select-all text-white">{cred}</span>
                            <button
                              onClick={() => copiarChave(cred, `${pedido.id}_${idx}`)}
                              className="text-gray-400 hover:text-white"
                              title="Copiar"
                            >
                              {copiadoId === `${pedido.id}_${idx}` ? (
                                <CheckCircle size={14} className="text-[#00e676]" />
                              ) : (
                                <Clipboard size={14} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : pedido.status === 'AGUARDANDO_PAGAMENTO' ? (
                    <div className="text-center py-2 space-y-3">
                      <Clock className="text-[#ffe600] mx-auto animate-pulse" size={28} />
                      <p className="text-xs text-gray-300 font-bold">Pagamento Pendente</p>
                      <button
                        onClick={() => {
                          setPixAbertoId(pedido.id);
                          setPixTotal(pedido.total);
                        }}
                        className="botao-primario w-full text-xs font-bold py-2 shadow-sm"
                      >
                        Pagar com PIX
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-xs">Aguardando processamento ou envio do suporte.</p>
                      <p className="text-[10px] text-gray-600 mt-1">Nossa equipe está separando seu produto!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reutiliza modal do PIX se o usuário clicar para pagar */}
      {pixAbertoId && (
        <ModalPix
          pedidoId={pixAbertoId}
          total={pixTotal}
          aoFechar={() => {
            setPixAbertoId(null);
            carregarPedidos();
          }}
          aoAtualizarEstoque={() => {}}
          aoLimparCarrinho={() => {}}
        />
      )}
    </div>
  );
}

